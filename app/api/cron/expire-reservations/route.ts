import { NextRequest, NextResponse } from 'next/server';
import { expireReservations } from '@/lib/inventory/service';

/**
 * GET /api/cron/expire-reservations
 * 
 * Cron endpoint to clean up expired inventory reservations.
 * Called periodically by Vercel Cron Jobs.
 * 
 * For Vercel deployment, add to vercel.json schedule pattern:
 * Every 1 minute: * /1 * * * * (without space)
 */
export async function GET(request: NextRequest) {
  try {
    const cronHeader = request.headers.get('x-vercel-cron');
    const isVercelRequest = cronHeader === 'true';
    const isLocalhost = request.nextUrl.hostname === 'localhost';
    
    if (!isVercelRequest && !isLocalhost) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const expiredCount = await expireReservations();
    console.log(`Expired ${expiredCount} reservations at ${new Date().toISOString()}`);

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
 * Alternative endpoint with shared secret for manual triggering
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid cron secret' },
        { status: 401 }
      );
    }

    const expiredCount = await expireReservations();
    console.log(`Expired ${expiredCount} reservations (via POST) at ${new Date().toISOString()}`);

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
