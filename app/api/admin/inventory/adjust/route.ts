// app/api/admin/inventory/adjust/route.ts
// Admin API for inventory adjustments

import { NextRequest, NextResponse } from 'next/server';
import { adjustInventory } from '@/lib/inventory/service';
import { inventoryLocations } from '@/drizzle/src/db/inventory-schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/admin/inventory/adjust
 * 
 * Admin-only endpoint to adjust inventory levels.
 * This creates an inventory movement and updates the inventory level.
 * 
 * Request body:
 * {
 *   "variantId": string,
 *   "locationId": string,
 *   "quantity": number,
 *   "movementType": "purchase" | "sale" | "return" | "restock" | "adjustment" | "damage" | "loss" | "transfer_in" | "transfer_out",
 *   "reason": string,
 *   "referenceType": string (optional),
 *   "referenceId": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication and authorization check
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Must be logged in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can adjust inventory' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.variantId || !body.locationId || !body.quantity || !body.movementType) {
      return NextResponse.json(
        { error: 'Missing required fields: variantId, locationId, quantity, movementType' },
        { status: 400 }
      );
    }

    // Validate movement type
    const validMovementTypes = [
      'purchase', 'sale', 'return', 'restock', 'adjustment', 
      'damage', 'loss', 'transfer_in', 'transfer_out'
    ];
    if (!validMovementTypes.includes(body.movementType)) {
      return NextResponse.json(
        { error: `Invalid movementType. Must be one of: ${validMovementTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate quantity
    if (typeof body.quantity !== 'number' || body.quantity === 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-zero number' },
        { status: 400 }
      );
    }

    // Validate location exists
    const location = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.id, body.locationId),
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Perform adjustment
    await adjustInventory({
      variantId: body.variantId,
      locationId: body.locationId,
      movementType: body.movementType,
      quantity: body.quantity,
      reason: body.reason || 'Manual adjustment',
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      performedBy: session.user.id, // Use actual user ID from session
    });

    return NextResponse.json({
      success: true,
      message: 'Inventory adjusted successfully',
    });

  } catch (error) {
    console.error('Inventory adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
