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

  // Guard: Verify that at least one valid source CAD drawing exists for this case
  const hasSourceDrawing = db.prepare(`
    SELECT 1 FROM uploaded_files
    WHERE quotation_case_id = ? AND file_role != 'VECTOR_SVG' AND file_type IN ('DWG', 'DXF')
    LIMIT 1
  `).get(id);

  if (!hasSourceDrawing) {
    return NextResponse.json({ error: '등록된 도면 파일이 없습니다.' }, { status: 404 });
  }

  const derivedDir = getStorageSubdir('derived');
  const localDerived = path.join(process.cwd(), 'storage', 'derived');
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\SteveLee', 'AppData', 'Roaming');
  const projectId = process.env.NEXT_PUBLIC_EGDESK_PROJECT_ID || '5883d2d5-7b0a-4947-a4fa-1f702c1dbc2f';
  const envName = process.env.NEXT_PUBLIC_EGDESK_ENV || 'development';
  const egdeskDerived = path.join(appData, 'egdesk', 'user-data', envName, 'projects', projectId, 'storage', 'derived');

  const candidates = [
    path.join(derivedDir, `${id}__cad_webgl.bin`),
    path.join(localDerived, `${id}__cad_webgl.bin`),
    path.join(egdeskDerived, `${id}__cad_webgl.bin`)
  ];

  let targetBin = '';
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      targetBin = c;
      break;
    }
  }

  // Cross-sync if found in one location
  if (targetBin) {
    for (const c of candidates) {
      if (!fs.existsSync(c)) {
        try {
          fs.mkdirSync(path.dirname(c), { recursive: true });
          fs.copyFileSync(targetBin, c);
        } catch {}
      }
    }
  }

  // Auto-generate if missing in all locations
  if (!targetBin || !fs.existsSync(targetBin)) {
    const sourceFile = db.prepare(`
      SELECT * FROM uploaded_files
      WHERE quotation_case_id = ? AND file_type IN ('DXF', 'DWG')
      ORDER BY (CASE WHEN file_type = 'DXF' THEN 1 ELSE 2 END) ASC, created_at DESC
      LIMIT 1
    `).get(id) as any;

    if (sourceFile && sourceFile.storage_path) {
      const srcPath = resolveStoragePath(sourceFile.storage_path);
      if (fs.existsSync(srcPath)) {
        const destBin = candidates[0];
        fs.mkdirSync(path.dirname(destBin), { recursive: true });
        const pyScript = path.join(process.cwd(), 'scripts', 'cad_webgl_exporter.py');
        spawnSync('python', [pyScript, srcPath, destBin], { timeout: 30000 });
        if (fs.existsSync(destBin)) {
          targetBin = destBin;
          // Copy to other locations as well
          for (const c of candidates) {
            if (c !== destBin && !fs.existsSync(c)) {
              try {
                fs.mkdirSync(path.dirname(c), { recursive: true });
                fs.copyFileSync(destBin, c);
              } catch {}
            }
          }
        }
      }
    }
  }

  if (!targetBin || !fs.existsSync(targetBin)) {
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
