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
    const unapprovedItems = db.prepare(`
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

      // 1. Audit
      db.prepare(`
        INSERT INTO bom_approval_records (
          id, quotation_case_id, normalized_item_id, selected_master_id,
          decision_type, decision_reason, is_override, approved_by_user_id, approved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        approvalId, id, item.id, item.master_id,
        'EXISTING_MASTER', '일괄 승인 (Bulk Approval)', 0, session.userId, now, now
      );

      // 2. Final BOM
      db.prepare(`
        INSERT OR REPLACE INTO final_bom_items (
          id, quotation_case_id, normalized_item_id, final_master_id, final_master_code,
          final_name, final_spec, final_material, final_quantity, final_unit,
          approval_status, approved_by_user_id, approved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalBomId, id, item.id, item.master_id, item.master_code,
        item.standard_name, item.master_spec || item.spec_candidate, item.master_mat || item.material_candidate,
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
