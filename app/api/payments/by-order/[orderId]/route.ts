import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/drizzle/src/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/payments/by-order/[orderId]
 *
 * Returns the latest payment status for an order.
 * Used by the failure page to detect if a late Daraja callback resolved the payment.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const latestPayment = await db
      .select({ status: payments.status, mpesaReceiptNumber: payments.mpesaReceiptNumber })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (!latestPayment[0]) {
      return NextResponse.json({ success: false, error: 'No payment found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: latestPayment[0].status,
      mpesaReceiptNumber: latestPayment[0].mpesaReceiptNumber,
    });
  } catch (error) {
    console.error('[by-order] Error fetching payment status:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
