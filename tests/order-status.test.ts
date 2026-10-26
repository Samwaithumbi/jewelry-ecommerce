import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidStatusTransition,
  getNextValidStatuses,
  getStatusLabel,
  OrderStatus,
} from '../lib/order-status';

describe('Order Status State Machine', () => {
  it('allows valid forward status transitions', () => {
    assert.strictEqual(isValidStatusTransition('pending', 'confirmed'), true);
    assert.strictEqual(isValidStatusTransition('confirmed', 'processing'), true);
    assert.strictEqual(isValidStatusTransition('processing', 'shipped'), true);
    assert.strictEqual(isValidStatusTransition('shipped', 'delivered'), true);
    assert.strictEqual(isValidStatusTransition('delivered', 'refunded'), true);
  });

  it('allows cancellation from early states', () => {
    assert.strictEqual(isValidStatusTransition('pending', 'cancelled'), true);
    assert.strictEqual(isValidStatusTransition('confirmed', 'cancelled'), true);
    assert.strictEqual(isValidStatusTransition('processing', 'cancelled'), true);
  });

  it('prohibits illegal or skipping transitions', () => {
    // Cannot skip straight from pending to delivered or shipped
    assert.strictEqual(isValidStatusTransition('pending', 'delivered'), false);
    assert.strictEqual(isValidStatusTransition('pending', 'shipped'), false);

    // Cannot un-cancel or un-refund (terminal states)
    assert.strictEqual(isValidStatusTransition('cancelled', 'pending'), false);
    assert.strictEqual(isValidStatusTransition('cancelled', 'confirmed'), false);
    assert.strictEqual(isValidStatusTransition('refunded', 'delivered'), false);

    // Cannot cancel after shipping
    assert.strictEqual(isValidStatusTransition('shipped', 'cancelled'), false);
  });

  it('returns correct next valid statuses', () => {
    assert.deepStrictEqual(getNextValidStatuses('pending'), ['confirmed', 'cancelled']);
    assert.deepStrictEqual(getNextValidStatuses('shipped'), ['delivered']);
    assert.deepStrictEqual(getNextValidStatuses('cancelled'), []);
    assert.deepStrictEqual(getNextValidStatuses('refunded'), []);
  });

  it('returns user-friendly status labels', () => {
    assert.strictEqual(getStatusLabel('pending'), 'Pending');
    assert.strictEqual(getStatusLabel('confirmed'), 'Confirmed');
    assert.strictEqual(getStatusLabel('processing'), 'Processing');
    assert.strictEqual(getStatusLabel('shipped'), 'Shipped');
    assert.strictEqual(getStatusLabel('delivered'), 'Delivered');
    assert.strictEqual(getStatusLabel('cancelled'), 'Cancelled');
    assert.strictEqual(getStatusLabel('refunded'), 'Refunded');
  });
});
