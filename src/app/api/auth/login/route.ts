import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { loginId, password } = await req.json();
    if (!loginId || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const session = await authenticateUser(loginId, password);
    if (!session) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    await createSession(session);
    return NextResponse.json({ success: true, user: session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
