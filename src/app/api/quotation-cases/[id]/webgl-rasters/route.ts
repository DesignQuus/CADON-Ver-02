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
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');

  // Verify that a valid CAD file exists
  const hasFile = fileId
    ? db.prepare(`SELECT 1 FROM uploaded_files WHERE quotation_case_id = ? AND (id = ? OR derived_from_file_id = ?) LIMIT 1`).get(id, fileId, fileId)
    : db.prepare(`SELECT 1 FROM uploaded_files WHERE quotation_case_id = ? LIMIT 1`).get(id);

  if (!hasFile) {
    return NextResponse.json({ error: '도면 파일을 찾을 수 없습니다.' }, { status: 404 });
  }

  const derivedDir = getStorageSubdir('derived');
  const localDerived = path.join(process.cwd(), 'storage', 'derived');
  const filePrefix = fileId ? `${id}_${fileId}` : id;

  const candidates = [
    path.join(derivedDir, `${filePrefix}__cad_rasters.json`),
    path.join(localDerived, `${filePrefix}__cad_rasters.json`),
    path.join(derivedDir, `${id}__cad_rasters.json`),
    path.join(localDerived, `${id}__cad_rasters.json`)
  ];

  let rasters: any[] = [];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const data = JSON.parse(fs.readFileSync(c, 'utf-8'));
        if (data.rasters && Array.isArray(data.rasters)) {
          rasters = data.rasters;
          break;
        }
      } catch {}
    }
  }

  // If no rasters extracted from DXF, provide standard D&I Solution logo location for A3 title block
  if (rasters.length === 0) {
    rasters.push({
      id: 'raster_logo',
      type: 'LOGO',
      x: 1886.9,
      y: 98.2,
      width: 380.0,
      height: 86.0,
      src: '/images/dni_solution_logo.png',
      label: 'D&I Solution'
    });
  } else {
    rasters = rasters.map((r) => ({
      ...r,
      src: r.src || '/images/dni_solution_logo.png'
    }));
  }

  return NextResponse.json({ rasters });
}
