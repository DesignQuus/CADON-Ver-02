import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const item = db.prepare('SELECT * FROM quote_items WHERE id = ?').get(id) as any;
  if (!item) {
    return NextResponse.json({ error: '견적 품목을 찾을 수 없습니다.' }, { status: 404 });
  }

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(item.quote_id) as any;
  if (quote.is_locked) {
    return NextResponse.json({ error: '승인 완료되어 잠긴 견적서는 직접 수정할 수 없습니다. 새 버전을 생성해주세요.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { unitPrice, remark, isIncluded, applyToSameItems } = body;
    const newPrice = Number(unitPrice);
    const newAmount = Math.round(item.quantity * newPrice);
    // Automatically set is_included = 1 when price is set or when explicitly requested
    const includeFlag = (isIncluded !== undefined) ? (isIncluded ? 1 : 0) : (newPrice > 0 ? 1 : (item.is_included ?? 1));

    // Update Primary Quote Item
    db.prepare(`
      UPDATE quote_items
      SET unit_price = ?, amount = ?, price_source = 'MANUAL_PRICE', price_status = 'READY', remark = ?, is_included = ?
      WHERE id = ?
    `).run(newPrice, newAmount, remark || item.remark || '수기 단가 입력', includeFlag, id);

    // Optionally apply to identical items in the same quote
    const updatedIds = [id];
    if (applyToSameItems) {
      const sameItems = db.prepare(`
        SELECT id, quantity FROM quote_items
        WHERE quote_id = ? AND item_name = ? AND id != ?
      `).all(quote.id, item.item_name, id) as any[];

      for (const s of sameItems) {
        const sAmount = Math.round(s.quantity * newPrice);
        db.prepare(`
          UPDATE quote_items
          SET unit_price = ?, amount = ?, price_source = 'MANUAL_PRICE', price_status = 'READY', remark = ?, is_included = ?
          WHERE id = ?
        `).run(newPrice, sAmount, remark || item.remark || '수기 단가 적용', includeFlag, s.id);
        updatedIds.push(s.id);
      }
    }

    // 방안 A: 수기 단가 풀(manual_price_pool)에 자동 누적 등록
    if (newPrice > 0) {
      try {
        const poolId = `mpp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO manual_price_pool (id, item_name, specification, material, unit_price, remark, quotation_case_id, created_by_user_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          poolId,
          item.item_name,
          item.specification || '',
          item.material || '',
          newPrice,
          remark || '수기 단가 적용',
          quote.quotation_case_id || null,
          session.userId || 'usr_sales1',
          new Date().toISOString()
        );
      } catch (poolErr) {
        console.warn('manual_price_pool insert skipped:', poolErr);
      }
    }

    // Recalculate Quote Totals (only active included items)
    const sumRow = db.prepare('SELECT SUM(amount) as subtotal FROM quote_items WHERE quote_id = ? AND is_included = 1').get(quote.id) as any;
    const subtotal = sumRow?.subtotal || 0;
    const taxAmount = Math.round(subtotal * (quote.tax_rate || 0.10));
    const totalAmount = subtotal + taxAmount;

    db.prepare(`
      UPDATE quotes
      SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(subtotal, taxAmount, totalAmount, new Date().toISOString(), quote.id);

    return NextResponse.json({ 
      success: true, 
      subtotal, 
      taxAmount, 
      totalAmount, 
      isIncluded: includeFlag,
      updatedIds 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '단가 수정 실패' }, { status: 500 });
  }
}
