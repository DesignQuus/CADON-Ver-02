import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const qc = db.prepare('SELECT * FROM quotation_cases WHERE id = ?').get(id) as any;
  if (!qc) {
    return NextResponse.json({ error: '견적건을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { drawingNos, isIncluded, all } = body;

    const latestQuote = db.prepare(`
      SELECT * FROM quotes 
      WHERE quotation_case_id = ? 
      ORDER BY quote_version DESC 
      LIMIT 1
    `).get(id) as any;

    if (!latestQuote) {
      return NextResponse.json({ error: '생성된 견적서가 없습니다.' }, { status: 400 });
    }

    if (latestQuote.is_locked) {
      return NextResponse.json({ error: '잠금(Lock) 승인된 견적서는 수정할 수 없습니다.' }, { status: 400 });
    }

    const flagVal = isIncluded ? 1 : 0;

    if (all) {
      db.prepare(`
        UPDATE quote_items 
        SET is_included = ? 
        WHERE quote_id = ?
      `).run(flagVal, latestQuote.id);
    } else if (body.pricedOnly) {
      db.prepare(`
        UPDATE quote_items 
        SET is_included = CASE WHEN unit_price > 0 THEN 1 ELSE 0 END 
        WHERE quote_id = ?
      `).run(latestQuote.id);
    } else if (Array.isArray(drawingNos) && drawingNos.length > 0) {
      const placeholders = drawingNos.map(() => '?').join(',');
      const matchedItems = db.prepare(`
        SELECT qi.id 
        FROM quote_items qi
        LEFT JOIN final_bom_items fbi ON qi.final_bom_item_id = fbi.id
        LEFT JOIN flattened_bom_items fb ON fb.id = REPLACE(fbi.normalized_item_id, 'norm_', 'fb_')
        WHERE qi.quote_id = ? AND (fb.part_no IN (${placeholders}) OR qi.item_name IN (${placeholders}))
      `).all(latestQuote.id, ...drawingNos, ...drawingNos) as any[];

      const itemIds = matchedItems.map(m => m.id);
      if (itemIds.length > 0) {
        const itemPlaceholders = itemIds.map(() => '?').join(',');
        db.prepare(`
          UPDATE quote_items 
          SET is_included = ? 
          WHERE id IN (${itemPlaceholders})
        `).run(flagVal, ...itemIds);
      }
    }

    // Recalculate Subtotal, VAT, Total
    const sumResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as active_subtotal
      FROM quote_items
      WHERE quote_id = ? AND is_included = 1
    `).get(latestQuote.id) as any;

    const subtotal = sumResult?.active_subtotal || 0;
    const taxRate = latestQuote.tax_rate ?? 0.10;
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    db.prepare(`
      UPDATE quotes 
      SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(subtotal, taxAmount, totalAmount, new Date().toISOString(), latestQuote.id);

    // Get current counts
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN is_included = 1 THEN 1 ELSE 0 END) as included_items
      FROM quote_items
      WHERE quote_id = ?
    `).get(latestQuote.id) as any;

    return NextResponse.json({
      success: true,
      quoteId: latestQuote.id,
      subtotal,
      taxAmount,
      totalAmount,
      totalItems: counts?.total_items || 0,
      includedItems: counts?.included_items || 0
    });
  } catch (error: any) {
    console.error('toggle-quote-drawing error:', error);
    return NextResponse.json({ error: error.message || '견적 항목 반영 실패' }, { status: 500 });
  }
}
