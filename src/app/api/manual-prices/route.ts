import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim() || '';

  try {
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS manual_price_pool (
        id TEXT PRIMARY KEY,
        item_name TEXT NOT NULL,
        specification TEXT,
        material TEXT,
        unit_price REAL NOT NULL,
        remark TEXT,
        quotation_case_id TEXT,
        created_by_user_id TEXT,
        created_at TEXT NOT NULL
      );
    `);

    let query = `
      SELECT 
        MAX(id) as id,
        item_name, 
        specification, 
        material, 
        unit_price, 
        MAX(remark) as remark, 
        MAX(quotation_case_id) as quotation_case_id, 
        MAX(created_at) as created_at,
        CASE
          WHEN LOWER(item_name) = LOWER(?) THEN 100
          WHEN LOWER(item_name) LIKE LOWER(?) THEN 50
          ELSE 10
        END as match_score
      FROM manual_price_pool
    `;
    const params: any[] = [name, `%${name}%`];

    if (name) {
      query += ` WHERE LOWER(item_name) LIKE LOWER(?) OR LOWER(specification) LIKE LOWER(?)`;
      params.push(`%${name}%`, `%${name}%`);
    }

    query += ` GROUP BY item_name, specification, material, unit_price`;
    query += ` ORDER BY match_score DESC, created_at DESC LIMIT 15`;

    const results = db.prepare(query).all(...params) as any[];

    // If matches are few, fetch most recent items from the pool as general suggestions
    if (results.length < 5) {
      const existingKeys = new Set(results.map((r: any) => `${r.item_name}_${r.unit_price}`));
      const recentGeneral = db.prepare(`
        SELECT 
          MAX(id) as id, 
          item_name, 
          specification, 
          material, 
          unit_price, 
          MAX(remark) as remark, 
          MAX(quotation_case_id) as quotation_case_id, 
          MAX(created_at) as created_at, 
          5 as match_score
        FROM manual_price_pool
        GROUP BY item_name, specification, material, unit_price
        ORDER BY created_at DESC
        LIMIT 10
      `).all() as any[];

      for (const r of recentGeneral) {
        const key = `${r.item_name}_${r.unit_price}`;
        if (!existingKeys.has(key)) {
          results.push(r);
          existingKeys.add(key);
        }
      }
    }

    return NextResponse.json({ success: true, list: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Manual Price 조회 실패' }, { status: 500 });
  }
}
