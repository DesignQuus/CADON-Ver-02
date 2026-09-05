import { NextResponse, NextRequest } from 'next/server';
import { destroySession, getSession } from '@/lib/auth';
import { recordActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await recordActivity(req, session, {
      activityType: 'LOGOUT',
      details: `${session.name} (${session.loginId}) 담당자 로그아웃 처리`
    });
  }
  await destroySession();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
