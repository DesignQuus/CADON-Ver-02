import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { recordActivity } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id) as any;
  if (!quote) {
    return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE quotes
    SET status = 'DRAFT', is_locked = 0, updated_at = ?
    WHERE id = ?
  `).run(now, id);

  await recordActivity(req, session, {
    activityType: 'QUOTE_UNLOCK',
    quotationCaseId: quote.quotation_case_id,
    details: `견적서 [${quote.quote_no}] 수정 잠금 해제 (DRAFT 상태 전환)`
  });

  return NextResponse.json({ success: true, status: 'DRAFT', isLocked: false });
}
