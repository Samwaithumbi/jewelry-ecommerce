import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders } from '@/drizzle/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Verify order exists and enforce ownership if attached to a user
    const orderRows = await db
      .select({ userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderRows[0]) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (orderRows[0].userId) {
      const session = await getServerSession(authOptions);
      const sessionUserId = session?.user?.id;
      const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
      if (orderRows[0].userId !== sessionUserId && !isAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
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
