import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    // Allow viewing if logged in
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '30', 10)));
    const offset = (page - 1) * limit;

    const userId = searchParams.get('userId');
    const activityType = searchParams.get('activityType');
    const search = searchParams.get('search')?.trim();

    const conditions: string[] = [];
    const params: any[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (activityType) {
      conditions.push('activity_type = ?');
      params.push(activityType);
    }

    if (search) {
      conditions.push('(details LIKE ? OR user_name LIKE ? OR case_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as cnt FROM user_activity_logs ${whereClause}`)
      .get(...params) as { cnt: number };

    const total = countRow ? countRow.cnt : 0;
    const totalPages = Math.ceil(total / limit);

    const logs = db
      .prepare(
        `SELECT * FROM user_activity_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    // Calculate Summary Stats
    const today = new Date().toISOString().split('T')[0];
    const statsRow = db.prepare(`
      SELECT
        COUNT(*) as totalLogs,
        SUM(CASE WHEN activity_type = 'LOGIN' AND created_at >= ? THEN 1 ELSE 0 END) as todayLogins,
        SUM(CASE WHEN activity_type = 'PRICE_UPDATE' THEN 1 ELSE 0 END) as priceUpdates,
        SUM(CASE WHEN activity_type = 'EXCEL_EXPORT' THEN 1 ELSE 0 END) as excelExports,
        SUM(CASE WHEN activity_type = 'QUOTE_TOGGLE' THEN 1 ELSE 0 END) as quoteToggles
      FROM user_activity_logs
    `).get(today) as {
      totalLogs: number;
      todayLogins: number;
      priceUpdates: number;
      excelExports: number;
      quoteToggles: number;
    };

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      totalPages,
      stats: {
        totalLogs: statsRow?.totalLogs || 0,
        todayLogins: statsRow?.todayLogins || 0,
        priceUpdates: statsRow?.priceUpdates || 0,
        excelExports: statsRow?.excelExports || 0,
        quoteToggles: statsRow?.quoteToggles || 0,
      }
    });
  } catch (error: any) {
    console.error('[AUDIT_LOGS_API_ERROR]', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
