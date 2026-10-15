import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import bcrypt from 'bcryptjs';

const DEV_ONLY_JWT_SECRET = 'dev-only-insecure-secret-do-not-use-in-production';
let cachedJwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (cachedJwtSecret) return cachedJwtSecret;
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
    }
    console.warn('[auth] JWT_SECRET 미설정: 개발용 임시 키를 사용합니다.');
    secret = DEV_ONLY_JWT_SECRET;
  }
  cachedJwtSecret = new TextEncoder().encode(secret);
  return cachedJwtSecret;
}

export interface UserSession {
  userId: string;
  loginId: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SALES_USER' | 'REVIEWER';
  companyId?: string | null;
}

export async function createSession(user: UserSession): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set('cadon_session', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return token;
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cadon_session')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('cadon_session');
}

export async function authenticateUser(loginId: string, plainPass: string): Promise<UserSession | null> {
  const user = db.prepare('SELECT * FROM users WHERE login_id = ? AND is_active = 1').get(loginId) as {
    id: string;
    login_id: string;
    password_hash: string;
    name: string;
    role: 'SUPER_ADMIN' | 'SALES_USER' | 'REVIEWER';
    company_id: string | null;
  } | undefined;

  if (!user) return null;

  const valid = bcrypt.compareSync(plainPass, user.password_hash);
  if (!valid) return null;

  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);

  return {
    userId: user.id,
    loginId: user.login_id,
    name: user.name,
    role: user.role,
    companyId: user.company_id
  };
}
