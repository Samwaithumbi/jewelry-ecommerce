"use server";

/**
 * Server Action: Get Admin Customers
 * 
 * F-10 Remediation:
 * - Replaces unbounded `select().from(orders)` with bounded, indexed database queries.
 * - Protects customer data with server-side administrator authorization (requireAdminSession).
 * - Implements stable ordering and bounded page sizes (default 50, max 100).
 * - Queries orders strictly for the active page of users (bounded inArray join).
 * - Preserves the exact data shape expected by the admin customers UI.
 */

import { db } from "@/lib/db";
import { users, orders } from "@/drizzle/src/db/schema";
import { desc, eq, inArray, sql, or, ilike } from "drizzle-orm";
import { requireAdminSession } from "@/lib/auth-guard";

interface ShippingAddressData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

const tierDisplayMap: Record<string, string> = {
  standard: "Bronze",
  vip: "Gold",
  wholesale: "Diamond",
};

// Orders that do NOT count towards customer revenue or active status
const EXCLUDED_STATUSES = ['cancelled', 'refunded'] as const;

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  totalCents: number;
  status: string;
  createdAt: Date;
}

export interface FormattedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  orders: number;
  totalSpent: number;
  joined: string;
  status: "Active" | "Inactive";
  isGuest: boolean;
  ordersData: CustomerOrderSummary[];
}

export interface GetCustomersOptions {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
}

export interface PaginatedCustomersResult {
  customers: FormattedCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch paginated customers with database-bounded queries and aggregation
 */
export async function getCustomersPaginated(
  options?: GetCustomersOptions
): Promise<PaginatedCustomersResult> {
  await requireAdminSession();

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 50));
  const offset = (page - 1) * limit;

  try {
    // 1. Build bounded user query with optional search filter
    const searchCondition = options?.search
      ? or(
          ilike(users.name, `%${options.search}%`),
          ilike(users.email, `%${options.search}%`)
        )
      : undefined;

    // Total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(searchCondition);

    const total = totalCountResult[0]?.count || 0;

    // Bounded page of users with stable ordering
    const pageUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        customerTier: users.customerTier,
        lifetimeSpend: users.lifetimeSpend,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(searchCondition)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit)
      .offset(offset);

    if (pageUsers.length === 0) {
      return {
        customers: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const userIds = pageUsers.map((u) => u.id);

    // 2. Fetch orders ONLY for the current page of users (bounded query)
    const userOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalCents: orders.totalCents,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(inArray(orders.userId, userIds))
      .orderBy(desc(orders.createdAt));

    // Group fetched orders by userId
    const ordersByUserId = new Map<string, typeof userOrders>();
    for (const order of userOrders) {
      if (!order.userId) continue;
      const existing = ordersByUserId.get(order.userId) || [];
      existing.push(order);
      ordersByUserId.set(order.userId, existing);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 3. Format customer records to match UI expectations
    const customers: FormattedCustomer[] = pageUsers.map((user) => {
      const customerOrders = ordersByUserId.get(user.id) || [];
      const validOrders = customerOrders.filter(
        (o) => !EXCLUDED_STATUSES.includes(o.status as typeof EXCLUDED_STATUSES[number])
      );

      const totalSpent = validOrders.reduce((sum, o) => sum + o.totalCents, 0);
      const hasRecentOrder = validOrders.some(
        (o) => new Date(o.createdAt) > thirtyDaysAgo
      );

      const mostRecentOrder = validOrders[0] || customerOrders[0];
      const phone = (mostRecentOrder?.shippingAddress as ShippingAddressData | null)?.phone || "";

      const joinedDate = new Date(user.createdAt);
      const joined = joinedDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const tier = user.customerTier
        ? tierDisplayMap[user.customerTier] || "Bronze"
        : "Bronze";

      return {
        id: `C-${user.id.slice(0, 4).toUpperCase()}`,
        name: user.name || "Unknown",
        email: user.email,
        phone,
        tier,
        orders: validOrders.length,
        totalSpent,
        joined,
        status: hasRecentOrder ? "Active" : "Inactive",
        isGuest: false,
        ordersData: customerOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalCents: o.totalCents,
          status: o.status,
          createdAt: o.createdAt,
        })),
      };
    });

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
}

/**
 * Standard getCustomers export preserving the existing signature
 * for backwards compatibility with existing UI components.
 */
export async function getCustomers(
  options?: GetCustomersOptions
): Promise<FormattedCustomer[]> {
  const result = await getCustomersPaginated(options);
  return result.customers;
}

/**
 * Get customer details by customerId directly without loading all customers
 */
export async function getCustomerById(
  customerId: string
): Promise<FormattedCustomer | null> {
  await requireAdminSession();

  try {
    // If ID format is C-XXXX, find user by partial UUID or match ID
    const rawId = customerId.startsWith("C-") ? customerId.slice(2).toLowerCase() : customerId;

    const user = await db.query.users.findFirst({
      where: sql`lower(cast(${users.id} as text)) like ${`${rawId}%`}`,
    });

    if (!user) {
      return null;
    }

    const userOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalCents: orders.totalCents,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    const validOrders = userOrders.filter(
      (o) => !EXCLUDED_STATUSES.includes(o.status as typeof EXCLUDED_STATUSES[number])
    );

    const totalSpent = validOrders.reduce((sum, o) => sum + o.totalCents, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const hasRecentOrder = validOrders.some(
      (o) => new Date(o.createdAt) > thirtyDaysAgo
    );

    const mostRecentOrder = validOrders[0] || userOrders[0];
    const phone = (mostRecentOrder?.shippingAddress as ShippingAddressData | null)?.phone || "";

    const joinedDate = new Date(user.createdAt);
    const joined = joinedDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const tier = user.customerTier
      ? tierDisplayMap[user.customerTier] || "Bronze"
      : "Bronze";

    return {
      id: customerId,
      name: user.name || "Unknown",
      email: user.email,
      phone,
      tier,
      orders: validOrders.length,
      totalSpent,
      joined,
      status: hasRecentOrder ? "Active" : "Inactive",
      isGuest: false,
      ordersData: userOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalCents: o.totalCents,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch customer by ID:", error);
    return null;
  }
}
