import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resolveStoragePath, getStorageSubdir } from '@/lib/storage';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const derivedDir = getStorageSubdir('derived');

  let targetTxt = path.join(derivedDir, `${id}__cad_texts.json`);
  if (!fs.existsSync(targetTxt)) {
    const fallbackTxt = path.join(process.cwd(), 'storage', 'derived', `${id}__cad_texts.json`);
    if (fs.existsSync(fallbackTxt)) targetTxt = fallbackTxt;
  }

  // Auto-generate if missing
  if (!fs.existsSync(targetTxt)) {
    const sourceFile = db.prepare(`
      SELECT * FROM uploaded_files
      WHERE quotation_case_id = ? AND file_type IN ('DXF', 'DWG')
      ORDER BY (CASE WHEN file_type = 'DXF' THEN 1 ELSE 2 END) ASC, created_at DESC
      LIMIT 1
    `).get(id) as any;

    if (sourceFile && sourceFile.storage_path) {
      const srcPath = resolveStoragePath(sourceFile.storage_path);
      if (fs.existsSync(srcPath)) {
        const pyScript = path.join(process.cwd(), 'scripts', 'cad_webgl_exporter.py');
        const targetBin = path.join(derivedDir, `${id}__cad_webgl.bin`);
        spawnSync('python', [pyScript, srcPath, targetBin]);
      }
    }
  }

  if (!fs.existsSync(targetTxt)) {
    return NextResponse.json({ texts: [] });
  }

  try {
    const fileContent = fs.readFileSync(targetTxt, 'utf-8');
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: '텍스트 데이터 읽기 실패: ' + err.message }, { status: 500 });
  }
}
