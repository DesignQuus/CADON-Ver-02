import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resolveStoragePath } from '@/lib/storage';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const exp = db.prepare('SELECT * FROM quote_exports WHERE id = ?').get(id) as any;
  if (!exp) {
    return NextResponse.json({ error: '다운로드할 파일을 찾을 수 없습니다.' }, { status: 404 });
  }

  const fullPath = resolveStoragePath(exp.storage_path);
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: '다운로드할 파일을 찾을 수 없습니다.' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const encodedName = encodeURIComponent(exp.file_name);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
    }
  });
}
