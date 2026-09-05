import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resolveStoragePath } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id, fileId } = await params;

  try {
    const file = db.prepare('SELECT * FROM uploaded_files WHERE id = ? AND quotation_case_id = ?').get(fileId, id) as any;
    if (!file) {
      return NextResponse.json({ error: '삭제할 파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 1. Find derived files linked to this file
    const derivedFiles = db.prepare('SELECT * FROM uploaded_files WHERE derived_from_file_id = ?').all(fileId) as any[];

    // 2. High-speed atomic DB transaction for instant deletion
    const deleteTx = db.transaction(() => {
      // Delete CAD parse runs and objects
      const parseRuns = db.prepare('SELECT id FROM cad_parse_runs WHERE source_file_id = ?').all(fileId) as any[];
      for (const pr of parseRuns) {
        db.prepare('DELETE FROM cad_objects WHERE parse_run_id = ?').run(pr.id);
        db.prepare('DELETE FROM cad_parse_runs WHERE id = ?').run(pr.id);
      }

      // Delete uploaded files
      db.prepare('DELETE FROM uploaded_files WHERE derived_from_file_id = ?').run(fileId);
      db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(fileId);

      // Check if any files remain for this case
      const remaining = db.prepare('SELECT COUNT(*) as cnt FROM uploaded_files WHERE quotation_case_id = ?').get(id) as any;
      if (remaining.cnt === 0) {
        db.prepare('DELETE FROM drawings WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM drawing_relationships WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM bom_areas WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM raw_bom_items WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM flattened_bom_items WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM normalized_bom_items WHERE quotation_case_id = ?').run(id);
        db.prepare('DELETE FROM final_bom_items WHERE quotation_case_id = ?').run(id);
        db.prepare(`
          UPDATE quotation_cases 
          SET status = 'REGISTERED', quote_readiness = 'PENDING_BOM'
          WHERE id = ?
        `).run(id);
      }
    });

    deleteTx();

    // 3. Delete physical files from disk asynchronously without blocking
    const allFilesToDelete = [file, ...derivedFiles];
    for (const f of allFilesToDelete) {
      if (f.storage_path) {
        const absPath = resolveStoragePath(f.storage_path);
        try {
          if (fs.existsSync(absPath)) {
            fs.unlink(absPath, () => {});
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `도면 '${file.original_file_name}' 및 연관 변환 파일이 즉시 삭제되었습니다.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '파일 삭제 중 오류 발생' }, { status: 500 });
  }
}
