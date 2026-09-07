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

  if (session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '최고관리자만 결재 승인/반려를 처리할 수 있습니다.' }, { status: 403 });
  }

  const { id } = await params;
  const request = db.prepare(`
    SELECT ar.*, qc.case_no, qc.case_name,
      u_req.name as requester_name,
      u_own.name as owner_name
    FROM approval_requests ar
    JOIN quotation_cases qc ON ar.quotation_case_id = qc.id
    JOIN users u_req ON ar.requester_user_id = u_req.id
    JOIN users u_own ON ar.owner_user_id = u_own.id
    WHERE ar.id = ?
  `).get(id) as any;

  if (!request) {
    return NextResponse.json({ error: '결재 요청을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const { decision, comment } = await req.json();

    if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
      return NextResponse.json({ error: '올바른 결재 구분(APPROVED 또는 REJECTED)을 입력해주세요.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE approval_requests
      SET status = ?,
          reviewed_by_user_id = ?,
          reviewed_at = ?,
          review_comment = ?
      WHERE id = ?
    `).run(decision, session.userId, now, comment?.trim() || null, id);

    // Audit log
    const decisionText = decision === 'APPROVED' ? '결재 승인' : '반려';
    await recordActivity(req, session, {
      activityType: 'APPROVAL_DECISION',
      quotationCaseId: request.quotation_case_id,
      caseName: request.case_name,
      details: `최고관리자(${session.name})가 ${request.requester_name} 담당자의 견적건(${request.case_no}) 수정 권한 요청을 ${decisionText} 처리함 (의견: ${comment?.trim() || '없음'})`
    });

    const updated = db.prepare(`
      SELECT ar.*, qc.case_no, qc.case_name,
        u_req.name as requester_name,
        u_own.name as owner_name,
        u_rev.name as reviewer_name
      FROM approval_requests ar
      JOIN quotation_cases qc ON ar.quotation_case_id = qc.id
      JOIN users u_req ON ar.requester_user_id = u_req.id
      JOIN users u_own ON ar.owner_user_id = u_own.id
      LEFT JOIN users u_rev ON ar.reviewed_by_user_id = u_rev.id
      WHERE ar.id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      message: `${decisionText} 처리가 완료되었습니다.`,
      request: updated
    });
  } catch (err: any) {
    console.error('Approval decision error:', err);
    return NextResponse.json({ error: err.message || '결재 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
