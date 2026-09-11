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
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');

  // Guard: Verify that at least one valid source CAD drawing exists for this case
  const hasSourceDrawing = fileId
    ? db.prepare(`
        SELECT 1 FROM uploaded_files
        WHERE quotation_case_id = ? AND (id = ? OR derived_from_file_id = ?) AND file_role != 'VECTOR_SVG' AND file_type IN ('DWG', 'DXF')
        LIMIT 1
      `).get(id, fileId, fileId)
    : db.prepare(`
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

  const filePrefix = fileId ? `${id}_${fileId}` : id;
  const candidates = [
    path.join(derivedDir, `${filePrefix}__cad_webgl.bin`),
    path.join(localDerived, `${filePrefix}__cad_webgl.bin`),
    path.join(egdeskDerived, `${filePrefix}__cad_webgl.bin`)
  ];

  // If fileId given and derived_from_file_id might have been used in naming, check alternative
  if (fileId) {
    const altRow = db.prepare(`
      SELECT id FROM uploaded_files
      WHERE quotation_case_id = ? AND (derived_from_file_id = ? OR id = ?) AND file_type = 'DXF'
      LIMIT 1
    `).get(id, fileId, fileId) as any;
    if (altRow && altRow.id !== fileId) {
      const altPrefix = `${id}_${altRow.id}`;
      candidates.push(
        path.join(derivedDir, `${altPrefix}__cad_webgl.bin`),
        path.join(localDerived, `${altPrefix}__cad_webgl.bin`),
        path.join(egdeskDerived, `${altPrefix}__cad_webgl.bin`)
      );
    }
  }

  // Fallback to legacy case-level cache if fileId is not explicitly provided
  if (!fileId) {
    candidates.push(
      path.join(derivedDir, `${id}__cad_webgl.bin`),
      path.join(localDerived, `${id}__cad_webgl.bin`),
      path.join(egdeskDerived, `${id}__cad_webgl.bin`)
    );
  }

  let targetBin = '';
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      targetBin = c;
      break;
    }
  }

  // Cross-sync if found in one location
  if (targetBin) {
    for (const c of candidates.slice(0, 3)) {
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
    const sourceFile = fileId
      ? (db.prepare(`
          SELECT * FROM uploaded_files
          WHERE quotation_case_id = ? AND (id = ? OR derived_from_file_id = ?) AND file_type IN ('DXF', 'DWG')
          ORDER BY (CASE WHEN file_type = 'DXF' THEN 1 ELSE 2 END) ASC, created_at DESC
          LIMIT 1
        `).get(id, fileId, fileId) as any)
      : (db.prepare(`
          SELECT * FROM uploaded_files
          WHERE quotation_case_id = ? AND file_type IN ('DXF', 'DWG')
          ORDER BY (CASE WHEN file_type = 'DXF' THEN 1 ELSE 2 END) ASC, created_at DESC
          LIMIT 1
        `).get(id) as any);

    if (sourceFile && sourceFile.storage_path) {
      let srcPath = resolveStoragePath(sourceFile.storage_path);
      
      // If the source file is DWG, convert to DXF on-the-fly via dwg_converter.py
      if (sourceFile.file_type === 'DWG' || srcPath.toLowerCase().endsWith('.dwg')) {
        const derivedDir = getStorageSubdir('derived');
        const dxfName = `${path.parse(sourceFile.stored_file_name || 'source').name}__converted.dxf`;
        const dxfPath = path.join(derivedDir, dxfName);
        if (!fs.existsSync(dxfPath)) {
          const convScript = path.join(process.cwd(), 'scripts', 'dwg_converter.py');
          spawnSync('python', [convScript, srcPath, dxfPath], { timeout: 60000 });
        }
        if (fs.existsSync(dxfPath)) {
          srcPath = dxfPath;
        }
      }

      if (fs.existsSync(srcPath) && srcPath.toLowerCase().endsWith('.dxf')) {
        const destBin = candidates[0];
        fs.mkdirSync(path.dirname(destBin), { recursive: true });
        const pyScript = path.join(process.cwd(), 'scripts', 'cad_webgl_exporter.py');
        spawnSync('python', [pyScript, srcPath, destBin], { timeout: 45000 });
        if (fs.existsSync(destBin)) {
          targetBin = destBin;
          // Copy to other locations as well
          for (const c of candidates.slice(0, 3)) {
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
