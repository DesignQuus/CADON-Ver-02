import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getStorageSubdir } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;

  const qc = db.prepare(`
    SELECT qc.*, c.company_name, c.company_code, p.project_name, p.project_code
    FROM quotation_cases qc
    JOIN companies c ON qc.company_id = c.id
    JOIN projects p ON qc.project_id = p.id
    WHERE qc.id = ?
  `).get(id) as any;

  if (!qc) {
    return NextResponse.json({ error: '견적건을 찾을 수 없습니다.' }, { status: 404 });
  }

  // Tenant Isolation Check
  if (session.role !== 'SUPER_ADMIN') {
    const access = db.prepare(`
      SELECT 1 FROM user_company_access
      WHERE user_id = ? AND company_id = ? AND is_active = 1
    `).get(session.userId, qc.company_id);
    if (!access) {
      return NextResponse.json({ error: '해당 고객사의 견적건에 접근할 권한이 없습니다.' }, { status: 403 });
    }
  }

  // Fetch all related entities (Exclude internal render cache like VECTOR_SVG)
  const files = db.prepare(`
    SELECT * FROM uploaded_files
    WHERE quotation_case_id = ? AND file_role != 'VECTOR_SVG' AND file_type != 'SVG'
    ORDER BY created_at ASC
  `).all(id);

  // If case has no source files and no drawings, return clean initial state
  const existingDrawingsCount = db.prepare('SELECT COUNT(*) as cnt FROM drawings WHERE quotation_case_id = ?').get(id) as any;
  if (files.length === 0 && (!existingDrawingsCount?.cnt || existingDrawingsCount?.cnt === 0)) {
    return NextResponse.json({
      case: { ...qc, status: 'REGISTERED', quote_readiness: 'PENDING_BOM' },
      files: [],
      drawings: [],
      relationships: [],
      bomAreas: [],
      rawBomItems: [],
      flattenedBomItems: [],
      normalizedItems: [],
      candidates: [],
      approvalRecords: [],
      finalBomItems: [],
      quotes: [],
      latestQuote: null,
      quoteItems: [],
      cadObjects: [],
      latestParseRun: null
    });
  }
  const drawings = db.prepare('SELECT * FROM drawings WHERE quotation_case_id = ? ORDER BY drawing_index ASC').all(id);
  const relationships = db.prepare('SELECT * FROM drawing_relationships WHERE quotation_case_id = ?').all(id);
  const bomAreas = db.prepare('SELECT * FROM bom_areas WHERE quotation_case_id = ?').all(id);
  const rawBomItems = db.prepare('SELECT * FROM raw_bom_items WHERE quotation_case_id = ? ORDER BY row_index ASC').all(id);
  const flattenedBomItems = db.prepare('SELECT * FROM flattened_bom_items WHERE quotation_case_id = ?').all(id);
  const normalizedItems = db.prepare(`
    SELECT 
      ni.*,
      COALESCE(fb.part_no, '') as drawing_no,
      fb.source_drawings_json,
      COALESCE(d.drawing_name_raw, ni.normalized_name) as drawing_name,
      COALESCE(d.revision, 'R00') as drawing_revision,
      COALESCE(d.scale, fb.specification, '-') as drawing_scale,
      COALESCE(d.material, fb.material, ni.material_candidate, 'SS400') as drawing_material,
      COALESCE(d.drawing_type, 'PART') as drawing_type,
      d.id as matched_drawing_id,
      p.project_name,
      p.project_code,
      c.company_name
    FROM normalized_bom_items ni
    LEFT JOIN flattened_bom_items fb 
      ON fb.id = REPLACE(ni.id, 'norm_', 'fb_')
    LEFT JOIN (
      SELECT 
        quotation_case_id,
        drawing_no_raw,
        drawing_no_normalized,
        drawing_name_raw,
        revision,
        scale,
        material,
        drawing_type,
        id
      FROM drawings
      GROUP BY quotation_case_id, drawing_no_raw
    ) d 
      ON d.quotation_case_id = ni.quotation_case_id 
      AND (d.drawing_no_raw = fb.part_no OR d.drawing_no_normalized = fb.part_no)
    LEFT JOIN quotation_cases qc ON qc.id = ni.quotation_case_id
    LEFT JOIN projects p ON qc.project_id = p.id
    LEFT JOIN companies c ON qc.company_id = c.id
    WHERE ni.quotation_case_id = ?
    ORDER BY ni.id ASC
  `).all(id);
  
  // Fetch candidates for normalized items
  const candidates = db.prepare(`
    SELECT mc.*, ni.raw_name, ni.normalized_name
    FROM master_candidates mc
    JOIN normalized_bom_items ni ON mc.normalized_item_id = ni.id
    WHERE ni.quotation_case_id = ?
    ORDER BY mc.rank ASC
  `).all(id);

  const approvalRecords = db.prepare('SELECT * FROM bom_approval_records WHERE quotation_case_id = ?').all(id);
  const finalBomItems = db.prepare('SELECT * FROM final_bom_items WHERE quotation_case_id = ?').all(id);
  const quotes = db.prepare('SELECT * FROM quotes WHERE quotation_case_id = ? ORDER BY quote_version DESC').all(id);

  // Latest quote items if exists
  let latestQuote = quotes[0] as any || null;
  let quoteItems: any[] = [];
  if (latestQuote) {
    quoteItems = db.prepare(`
      SELECT 
        qi.*,
        COALESCE(fb.part_no, '') as drawing_no,
        COALESCE(fb.name, qi.item_name) as drawing_name
      FROM quote_items qi
      LEFT JOIN final_bom_items fbi ON qi.final_bom_item_id = fbi.id
      LEFT JOIN flattened_bom_items fb ON fb.id = REPLACE(fbi.normalized_item_id, 'norm_', 'fb_')
      WHERE qi.quote_id = ?
      ORDER BY qi.item_no ASC
    `).all(latestQuote.id);
  }

  // Latest CAD Parse Run and Objects for preview
  const latestParseRun = db.prepare(`
    SELECT cpr.id, cpr.source_file_id, cpr.status, cpr.total_entities, cpr.created_at
    FROM cad_parse_runs cpr
    JOIN uploaded_files uf ON cpr.source_file_id = uf.id
    WHERE uf.quotation_case_id = ?
    ORDER BY cpr.created_at DESC
    LIMIT 1
  `).get(id) as any;

  let cadObjects: any[] = [];
  if (latestParseRun) {
    cadObjects = db.prepare(`
      SELECT * FROM cad_objects
      WHERE parse_run_id = ?
      LIMIT 60000
    `).all(latestParseRun.id);
  }

  return NextResponse.json({
    case: qc,
    files,
    drawings,
    relationships,
    bomAreas,
    rawBomItems,
    flattenedBomItems,
    normalizedItems,
    candidates,
    approvalRecords,
    finalBomItems,
    quotes,
    latestQuote,
    quoteItems,
    cadObjects,
    latestParseRun
  });
}
