# Production Inventory System

This document describes the production-grade inventory system implemented for the jewelry e-commerce application.

## Architecture Overview

The inventory system follows the recommended architecture with clear separation of concerns:

```
PRODUCTS → VARIANTS → INVENTORY LEVELS → RESERVATIONS → MOVEMENTS
```

### Key Principles

1. **Catalog vs Inventory Separation**: Product/variant data is separate from inventory data
2. **Atomic Operations**: All inventory changes use database-level atomic operations to prevent race conditions
3. **Immutable Audit Trail**: Every inventory change is recorded in the movements ledger
4. **Reservation-Based Checkout**: Stock is reserved before payment, not sold
5. **Available = onHand - reserved**: Available stock is calculated, not stored

## Database Schema

### New Tables

#### `inventory_locations`
Physical locations where inventory is stored (warehouse, store, display, etc.)

- `id`: UUID primary key
- `name`: Location name
- `code`: Unique location code (e.g., "MAIN")
- `type`: Location type (warehouse, store, display, damaged, transit)
- `active`: Boolean indicating if location is active

#### `inventory_levels`
Current snapshot of inventory for each variant at each location

- `id`: UUID primary key
- `variant_id`: Foreign key to product_variants
- `location_id`: Foreign key to inventory_locations
- `on_hand`: Physical quantity in stock
- `reserved`: Quantity reserved for pending orders
- `reorder_point`: Threshold for low stock alerts
- `reorder_quantity`: Suggested reorder quantity

**Constraints**:
- `on_hand >= 0`
- `reserved >= 0`
- `reserved <= on_hand`
- Unique (variant_id, location_id)

#### `inventory_movements`
Immutable audit ledger of all inventory changes

- `id`: UUID primary key
- `variant_id`: Foreign key to product_variants
- `location_id`: Foreign key to inventory_locations
- `movement_type`: purchase, sale, return, restock, adjustment, damage, loss, transfer_in, transfer_out
- `quantity`: Quantity changed (positive for additions, negative for removals)
- `reference_type`: Optional reference type (order, adjustment, purchase_order)
- `reference_id`: Optional reference ID
- `reason`: Human-readable reason for the movement
- `performed_by`: User ID who performed the action

**Constraint**: `quantity != 0`

#### `inventory_reservations`
Temporary holds on inventory during checkout

- `id`: UUID primary key
- `user_id`: Foreign key to users (nullable)
- `order_id`: Foreign key to orders (nullable)
- `status`: active, confirmed, released, expired, cancelled
- `expires_at`: Timestamp when reservation expires

#### `inventory_reservation_items`
Individual items within a reservation

- `id`: UUID primary key
- `reservation_id`: Foreign key to inventory_reservations
- `variant_id`: Foreign key to product_variants
- `location_id`: Foreign key to inventory_locations
- `quantity`: Quantity reserved

**Constraint**: `quantity > 0`

## Inventory Service

The inventory service (`lib/inventory/service.ts`) provides the single source of truth for all inventory operations.

### Core Operations

#### `getAvailableStock(variantId, locationId)`
Returns available stock for a variant at a location.
- `available = onHand - reserved`

#### `getInventoryLevel(variantId, locationId)`
Returns full inventory level details including calculated available stock.

#### `reserveInventory(input)`
Atomically reserves inventory for an order. This is the critical operation that prevents race conditions.

**Input**:
```typescript
{
  orderId: string;
  userId?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  expiresAt: Date;
}
```

**Process**:
1. Creates reservation record
2. For each item, atomically increments `reserved` count
3. Uses conditional update: `WHERE on_hand - reserved >= quantity`
4. Creates reservation items
5. Returns reservation ID

**Error**: Throws `InsufficientStockError` if insufficient stock available.

#### `releaseReservation(reservationId)`
Releases a reservation (payment failed or cancelled).
- Decrements `reserved` count
- No inventory movement is created
- Updates reservation status to "released"

#### `confirmReservation(reservationId)`
Confirms a reservation (payment successful).
- Decrements `reserved` count
- Decrements `on_hand` count
- Creates "sale" movement with negative quantity
- Updates reservation status to "confirmed"

#### `adjustInventory(input)`
Admin operation to adjust inventory levels.
- Creates inventory movement
- Updates `on_hand` count
- Requires reason for audit trail

#### `returnInventory(variantId, locationId, quantity, orderId)`
Returns inventory after order cancellation/refund.
- Increments `on_hand` count
- Creates "return" movement with positive quantity

#### `expireReservations()`
Worker function to expire old reservations.
- Finds reservations with `expires_at < now` and status "active"
- Releases inventory for each expired reservation
- Updates status to "expired"
- Returns count of expired reservations

#### `getLowStockItems(locationId?)`
Returns items where `available <= reorder_point`.

#### `getOutOfStockItems(locationId?)`
Returns items where `available = 0`.

#### `getInventoryMovements(filters?)`
Returns inventory movements with optional filtering for audit trail.

## Integration with M-Pesa

The M-Pesa callback handler (`lib/mpesa/db.ts`) has been updated to integrate with the inventory system:

### Payment Success
1. Finds reservation for the order
2. Calls `confirmReservation(reservationId)`
3. Updates order status to "confirmed"
4. Sends confirmation email

### Payment Failure/Cancel
1. Finds reservation for the order
2. Calls `releaseReservation(reservationId)`
3. Updates order status to "cancelled"
4. Sends failure email

The integration is idempotent - if a reservation is already in the correct state, it logs a warning and continues.

## Setup Instructions

### 1. Run Database Migration

```bash
pnpm tsx scripts/migrate-inventory.ts
```

This creates:
- All inventory tables
- Indexes for performance
- Foreign key constraints
- Check constraints for data integrity

### 2. Seed Initial Inventory

```bash
pnpm tsx scripts/seed-inventory.ts
```

This:
- Creates "MAIN" warehouse location
- Migrates existing stock from `product_variants.stock_qty` to `inventory_levels`
- Creates initial inventory movements for audit trail
- Sets reorder points based on existing `low_stock_threshold`

### 3. Update Checkout Flow

Your checkout flow should now:

1. Validate cart items (product active, variant active, current price)
2. Call `reserveInventory()` before initiating M-Pesa STK Push
3. Store reservation ID with the order
4. On payment callback, the system automatically confirms/releases the reservation

Example checkout integration:
```typescript
import { reserveInventory } from '@/lib/inventory/service';

// During checkout
const reservationId = await reserveInventory({
  orderId: order.id,
  userId: session.user.id,
  items: cartItems.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
  })),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
});

// Store reservationId with order
await db.update(orders)
  .set({ reservationId })
  .where(eq(orders.id, order.id));

// Then initiate M-Pesa payment
```

### 4. Set Up Reservation Expiration Worker

Run the expiration worker periodically to release expired reservations:

```bash
pnpm tsx scripts/expire-reservations.ts
```

For production, set this up as a cron job:
- Every 1 minute: `*/1 * * * *`
- Or use Vercel Cron Jobs if deployed on Vercel

### 5. Admin Inventory Adjustment API

The admin API endpoint is available at:
```
POST /api/admin/inventory/adjust
```

Request body:
```json
{
  "variantId": "uuid",
  "locationId": "uuid",
  "quantity": 10,
  "movementType": "restock",
  "reason": "Supplier delivery #PO-1003",
  "referenceType": "purchase_order",
  "referenceId": "uuid"
}
```

**IMPORTANT**: Add authentication/authorization before using in production.

## Testing

### Critical Test: Concurrent Checkout

Test that two users cannot buy the same item simultaneously:

```typescript
// User A and User B both try to buy the last item
const promise1 = reserveInventory({ ... });
const promise2 = reserveInventory({ ... });

const [result1, result2] = await Promise.allSettled([promise1, promise2]);

// Expected: One success, one InsufficientStockError
// Never: Both success with stock going negative
```

### Other Required Tests

- ✓ Reserve available stock
- ✓ Reject insufficient stock
- ✓ Release reservation
- ✓ Confirm reservation
- ✓ Reservation expiration
- ✓ Payment success → reservation confirmed
- ✓ Payment failure → reservation released
- ✓ Cancellation → return inventory
- ✓ Admin adjustment
- ✓ Negative stock protection
- ✓ Duplicate payment callback
- ✓ Duplicate reservation confirmation

## Migration from Old System

### Before Migration

Your current system uses:
- `product_variants.stock_qty` for inventory
- `product_variants.low_stock_threshold` for reorder points

### After Migration

The new system uses:
- `inventory_levels.on_hand` for physical stock
- `inventory_levels.reserved` for reserved stock
- `inventory_levels.reorder_point` for reorder thresholds

### Recommended Steps

1. **Run migration and seed** (creates new tables, migrates data)
2. **Verify inventory levels** are correct
3. **Update application code** to use inventory service instead of `product_variants.stock_qty`
4. **Test checkout flow** with new reservation system
5. **Remove old columns** from `product_variants`:
   ```sql
   ALTER TABLE product_variants DROP COLUMN stock_qty;
   ALTER TABLE product_variants DROP COLUMN low_stock_threshold;
   ```

## Admin Dashboard Features

Your admin dashboard should include:

### Inventory Overview
- Total SKUs
- Total units in stock
- Total reserved units
- Total available units
- Low stock count
- Out of stock count
- Inventory value

### Stock Table
Columns: SKU, Product, On Hand, Reserved, Available, Status

Status logic:
- In Stock: `available > reorder_point`
- Low Stock: `0 < available <= reorder_point`
- Out of Stock: `available = 0`

### Low Stock Alert
List of items where `available <= reorder_point`

### Out of Stock Alert
List of items where `available = 0`

### Reservations
- Active reservations
- Expired reservations
- Reservation history

### Movements
- Audit trail of all inventory changes
- Filter by variant, location, movement type, date range
- Export functionality

### Adjustments
- Form to create inventory adjustments
- Requires reason for audit trail
- Creates movement record

## Production Considerations

### Database Transactions

The current implementation uses Neon HTTP which doesn't support transactions. For production:

1. **Use Neon Serverless** with transaction support, or
2. **Use PostgreSQL connection pooling** with `pg` driver, or
3. **Implement application-level locking** with Redis

### Row-Level Locking

For highly contested inventory, use row-level locks:

```sql
SELECT * FROM inventory_levels
WHERE variant_id = $1 AND location_id = $2
FOR UPDATE;
```

This prevents two transactions from modifying the same row simultaneously.

### Reservation Expiration

Set reservation expiration based on your checkout flow:
- **10-15 minutes** for typical checkout
- **30 minutes** for complex checkout with multiple steps
- **Never** rely on manual expiration - always use automated worker

### Monitoring

Monitor these metrics:
- Reservation expiration rate
- Failed reservation rate (insufficient stock)
- Average reservation duration
- Inventory adjustment frequency
- Low stock alerts

### Backup and Recovery

- Regular database backups
- Inventory movements are immutable - never delete
- If adjustment mistake is made, create correcting adjustment
- Keep audit trail for compliance

## Future Enhancements

### Serialized Inventory
For expensive jewelry with unique serial numbers:
- Add `inventory_units` table
- Track individual items by serial number
- Link certificates to specific units

### Multi-Warehouse
- Add warehouse optimization
- Automatic stock transfers
- Location-based fulfillment

### Purchasing System
- Add `suppliers` table
- Add `purchase_orders` table
- Add `goods_receipts` table
- Automatic reorder based on reorder_point

### Demand Forecasting
- Track sales velocity
- Predict stockouts
- Optimize reorder quantities

## Troubleshooting

### Issue: Negative Stock

**Cause**: Race condition or direct database manipulation

**Solution**:
- Ensure all inventory changes go through inventory service
- Use atomic operations with conditional updates
- Add row-level locking for high-contention items

### Issue: Stuck Reservations

**Cause**: Payment callback not received or worker not running

**Solution**:
- Check M-Pesa callback logs
- Ensure expiration worker is running
- Manually expire old reservations via admin

### Issue: Stock Not Updating

**Cause**: Foreign key constraints or missing inventory level

**Solution**:
- Ensure inventory level exists for variant/location
- Check foreign key relationships
- Run seed script to create missing levels

## Support

For issues or questions about the inventory system:
1. Check this documentation
2. Review the inventory service code
3. Check database constraints and indexes
4. Review M-Pesa callback logs
5. Test with the provided scripts
