import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { recordActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { action, reason } = await req.json();

    const targetCase = db.prepare('SELECT * FROM quotation_cases WHERE id = ?').get(id) as any;
    if (!targetCase) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'REQUEST_PRIVATE') {
      if (targetCase.created_by_user_id !== session.userId && session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      db.prepare(`
        UPDATE quotation_cases 
        SET visibility = 'PRIVATE_PENDING', visibility_reason = ?, updated_at = ?
        WHERE id = ?
      `).run(reason || null, now, id);

      await recordActivity(req, session, {
        activityType: 'VISIBILITY_CHANGE',
        quotationCaseId: id,
        caseName: targetCase.case_name,
        details: `Requested PRIVATE visibility. Reason: ${reason || 'N/A'}`
      });
      return NextResponse.json({ success: true, visibility: 'PRIVATE_PENDING' });

    } else if (action === 'APPROVE') {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      db.prepare(`
        UPDATE quotation_cases 
        SET visibility = 'PRIVATE', updated_at = ?
        WHERE id = ?
      `).run(now, id);

      await recordActivity(req, session, {
        activityType: 'VISIBILITY_CHANGE',
        quotationCaseId: id,
        caseName: targetCase.case_name,
        details: 'Approved PRIVATE visibility request.'
      });
      return NextResponse.json({ success: true, visibility: 'PRIVATE' });

    } else if (action === 'REJECT') {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      db.prepare(`
        UPDATE quotation_cases 
        SET visibility = 'SHARED', visibility_reason = NULL, updated_at = ?
        WHERE id = ?
      `).run(now, id);

      await recordActivity(req, session, {
        activityType: 'VISIBILITY_CHANGE',
        quotationCaseId: id,
        caseName: targetCase.case_name,
        details: 'Rejected PRIVATE visibility request.'
      });
      return NextResponse.json({ success: true, visibility: 'SHARED' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating visibility:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}