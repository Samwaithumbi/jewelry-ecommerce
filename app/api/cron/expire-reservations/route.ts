import { NextRequest, NextResponse } from 'next/server';
import { expireReservations } from '@/lib/inventory/service';

function isCronAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;

  // In development mode only, allow localhost testing without secret if not configured
  if (process.env.NODE_ENV === 'development' && request.nextUrl.hostname === 'localhost') {
    return true;
  }

  // In preview and production, a valid CRON_SECRET is strictly required
  if (!expectedSecret) {
    console.error('[Cron Error] CRON_SECRET is not configured on server.');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const providedSecret = bearerToken || cronSecretHeader;

  // A spoofed x-vercel-cron header alone MUST NOT authorize the cron request
  return Boolean(providedSecret && providedSecret === expectedSecret);
}

/**
 * GET /api/cron/expire-reservations
 * 
 * Clean up expired inventory reservations.
 * Called by Vercel Cron with Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing cron credentials' },
        { status: 401 }
      );
    }

    const expiredCount = await expireReservations();

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to expire reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/expire-reservations
 * 
 * Alternative endpoint for manual or external triggering with shared secret
 */
export async function POST(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing cron credentials' },
        { status: 401 }
      );
    }

    const expiredCount = await expireReservations();

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to expire reservations via POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
