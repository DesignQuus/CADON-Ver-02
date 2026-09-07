import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const qc = db.prepare('SELECT * FROM quotation_cases WHERE id = ?').get(id) as any;
  if (!qc) {
    return NextResponse.json({ error: '견적건을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const approveAll = body.approveAll ?? true;

    const unapprovedItems = approveAll && !body.onlyMatched
      ? db.prepare(`
          SELECT 
            ni.*, 
            COALESCE(fb.part_no, '') as drawing_no,
            COALESCE(d.drawing_name_raw, ni.normalized_name) as drawing_name,
            COALESCE(d.scale, fb.specification, ni.spec_candidate, '-') as drawing_spec,
            COALESCE(d.material, fb.material, ni.material_candidate, 'SS400') as drawing_mat,
            mc.master_id, 
            mc.master_code, 
            mc.standard_name, 
            mc.specification as master_spec, 
            mc.material as master_mat
          FROM normalized_bom_items ni
          LEFT JOIN flattened_bom_items fb ON fb.id = REPLACE(ni.id, 'norm_', 'fb_')
          LEFT JOIN (
            SELECT quotation_case_id, drawing_no_raw, drawing_no_normalized, drawing_name_raw, scale, material
            FROM drawings
            GROUP BY quotation_case_id, drawing_no_raw
          ) d ON d.quotation_case_id = ni.quotation_case_id 
             AND (d.drawing_no_raw = fb.part_no OR d.drawing_no_normalized = fb.part_no)
          LEFT JOIN master_candidates mc ON mc.normalized_item_id = ni.id AND mc.rank = 1
          WHERE ni.quotation_case_id = ?
            AND ni.id NOT IN (SELECT normalized_item_id FROM final_bom_items WHERE quotation_case_id = ?)
        `).all(id, id) as any[]
      : db.prepare(`
          SELECT ni.*, mc.master_id, mc.master_code, mc.standard_name, mc.specification as master_spec, mc.material as master_mat
          FROM normalized_bom_items ni
          JOIN master_candidates mc ON mc.normalized_item_id = ni.id AND mc.rank = 1
          WHERE ni.quotation_case_id = ?
            AND ni.id NOT IN (SELECT normalized_item_id FROM final_bom_items WHERE quotation_case_id = ?)
        `).all(id, id) as any[];

    const now = new Date().toISOString();
    let approvedCount = 0;

    for (const item of unapprovedItems) {
      const approvalId = `appr_${Date.now()}_${approvedCount}`;
      const finalBomId = `final_${item.id}`;
      const isMatched = !!item.master_id;

      const decisionType = isMatched ? 'EXISTING_MASTER' : 'CUSTOM_PART';
      const decisionReason = isMatched ? '1순위 마스터 추천 일괄 승인' : '도면 가공품 자동 승인 (신규/주문제작)';
      const finalCode = isMatched ? item.master_code : (item.drawing_no || 'CUSTOM');
      const finalName = isMatched ? item.standard_name : (item.drawing_name || item.normalized_name);
      const finalSpec = isMatched ? (item.master_spec || item.spec_candidate) : (item.drawing_spec || item.spec_candidate || '-');
      const finalMat = isMatched ? (item.master_mat || item.material_candidate) : (item.drawing_mat || item.material_candidate || 'SS400');

      // 1. Audit
      db.prepare(`
        INSERT INTO bom_approval_records (
          id, quotation_case_id, normalized_item_id, selected_master_id,
          decision_type, decision_reason, is_override, approved_by_user_id, approved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        approvalId, id, item.id, item.master_id || null,
        decisionType, decisionReason, 0, session.userId, now, now
      );

      // 2. Final BOM
      db.prepare(`
        INSERT OR REPLACE INTO final_bom_items (
          id, quotation_case_id, normalized_item_id, final_master_id, final_master_code,
          final_name, final_spec, final_material, final_quantity, final_unit,
          approval_status, approved_by_user_id, approved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalBomId, id, item.id, item.master_id || null, finalCode,
        finalName, finalSpec, finalMat,
        item.quantity, item.unit, 'APPROVED', session.userId, now, now
      );

      approvedCount++;
    }

    // Update readiness
    const readiness = 'READY_FOR_QUOTE';
    db.prepare('UPDATE quotation_cases SET quote_readiness = ?, updated_at = ? WHERE id = ?').run(readiness, now, id);

    return NextResponse.json({ success: true, approvedCount, readiness });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '일괄 승인 실패' }, { status: 500 });
  }
}
