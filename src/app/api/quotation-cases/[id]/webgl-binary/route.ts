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

  let targetBin = path.join(derivedDir, `${id}__cad_webgl.bin`);
  if (!fs.existsSync(targetBin)) {
    const fallbackBin = path.join(process.cwd(), 'storage', 'derived', `${id}__cad_webgl.bin`);
    if (fs.existsSync(fallbackBin)) targetBin = fallbackBin;
  }

  // Auto-generate if missing
  if (!fs.existsSync(targetBin)) {
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
        spawnSync('python', [pyScript, srcPath, targetBin]);
      }
    }
  }

  if (!fs.existsSync(targetBin)) {
    return NextResponse.json({ error: 'WebGL CAD 바이너리 데이터를 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(targetBin);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Disposition': `inline; filename="${id}__cad_webgl.bin"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: '바이너리 읽기 실패: ' + err.message }, { status: 500 });
  }
}
