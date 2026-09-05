import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { recordActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let cases;
  if (session.role === 'SUPER_ADMIN') {
    cases = db.prepare(`
      SELECT qc.*, c.company_name, c.company_code, p.project_name, p.project_code
      FROM quotation_cases qc
      JOIN companies c ON qc.company_id = c.id
      JOIN projects p ON qc.project_id = p.id
      ORDER BY qc.created_at DESC
    `).all();
  } else {
    cases = db.prepare(`
      SELECT qc.*, c.company_name, c.company_code, p.project_name, p.project_code
      FROM quotation_cases qc
      JOIN companies c ON qc.company_id = c.id
      JOIN projects p ON qc.project_id = p.id
      JOIN user_company_access uca ON uca.company_id = c.id
      WHERE uca.user_id = ? AND uca.is_active = 1
      ORDER BY qc.created_at DESC
    `).all(session.userId);
  }

  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { companyId, projectId, caseName, requestDate } = await req.json();
    if (!companyId || !projectId || !caseName) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countRow = db.prepare(`
      SELECT COUNT(*) as cnt FROM quotation_cases WHERE case_no LIKE ?
    `).get(`QT-${dateStr}-%`) as { cnt: number };

    const seq = String(countRow.cnt + 1).padStart(3, '0');
    const caseNo = `QT-${dateStr}-${seq}`;
    const id = `case_${Date.now()}`;

    db.prepare(`
      INSERT INTO quotation_cases (
        id, case_no, company_id, project_id, case_name, request_date,
        status, revision, quote_readiness, created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, caseNo, companyId, projectId, caseName,
      requestDate || now.toISOString().slice(0, 10),
      'DRAFT', '0', 'NOT_READY', session.userId, now.toISOString(), now.toISOString()
    );

    // Audit log: CASE_CREATE
    await recordActivity(req, session, {
      activityType: 'CASE_CREATE',
      quotationCaseId: id,
      caseName: `[${caseNo}] ${caseName}`,
      details: `신규 견적의뢰 건 등록: [${caseNo}] ${caseName}`
    });

    return NextResponse.json({ success: true, caseId: id, caseNo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '견적건 생성 실패' }, { status: 500 });
  }
}
