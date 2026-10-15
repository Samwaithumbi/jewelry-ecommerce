'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getStatusLabel, 
  getStatusColor, 
  OrderStatus 
} from '@/lib/order-status';
import { 
  Package, 
  Eye, 
  Truck, 
  ExternalLink, 
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  shippingAddress: any;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (cents: number) => {
    return `KSh ${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrackingUrl = (trackingNumber: string, carrier: string) => {
    const carrierUrls: Record<string, string> = {
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?tracking-id=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    };
    return carrierUrls[carrier] || `https://www.google.com/search?q=${trackingNumber}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">My Orders</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage your order history
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88E2F]"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-16 text-center">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Explore our handcrafted fine jewelry collection to get started.
            </p>
            <Link href="/products">
              <Button className="bg-[#111827] text-white hover:bg-[#111827]/90 rounded-full px-6">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-semibold">Order History</CardTitle>
              <span className="text-xs text-muted-foreground">
                {orders.length} order{orders.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-6">
            {/* Mobile View: Clean, Touch-Friendly Card List */}
            <div className="block md:hidden space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3 hover:border-gray-300 transition"
                >
                  {/* Top Bar: Order Number & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Order Number
                      </span>
                      <span className="font-mono font-semibold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Date & Amount Row */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-100 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Date Placed</span>
                      <span className="font-medium text-gray-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Total</span>
                      <span className="font-bold text-[#B88E2F] text-sm mt-0.5 block">
                        {formatCurrency(order.totalCents)}
                      </span>
                    </div>
                  </div>

                  {/* Tracking Info (if applicable) */}
                  {order.trackingNumber ? (
                    <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg p-2.5">
                      <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Truck className="h-3.5 w-3.5 text-blue-600" />
                        Tracking
                      </span>
                      <a
                        href={getTrackingUrl(order.trackingNumber, order.carrier || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>{order.trackingNumber}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : null}

                  {/* View Details Action */}
                  <Link href={`/account/orders/${order.id}`} className="block pt-1">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 text-xs font-semibold rounded-lg border-gray-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        View Order Details
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {/* Desktop View: Full-Featured Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Order</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Total</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Tracking</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <TableCell>
                        <div className="font-mono font-medium text-xs text-[#111827]">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} rounded-full font-medium text-xs`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-[#B88E2F] text-xs">
                        {formatCurrency(order.totalCents)}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <a
                            href={getTrackingUrl(order.trackingNumber, order.carrier || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>{order.trackingNumber}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {order.status === 'shipped' || order.status === 'delivered'
                              ? 'Tracking unavailable'
                              : 'Not shipped yet'
                            }
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/account/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-slate-700 hover:text-black hover:bg-gray-100 rounded-lg cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Status Legend */}
      <Card className="border-gray-200 shadow-2xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900">Order Status Guide</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-yellow-100 text-yellow-800 w-fit rounded-full text-[10px]">Pending</Badge>
              <span className="text-[11px] text-muted-foreground">Order received</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-blue-100 text-blue-800 w-fit rounded-full text-[10px]">Confirmed</Badge>
              <span className="text-[11px] text-muted-foreground">Payment verified</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-purple-100 text-purple-800 w-fit rounded-full text-[10px]">Processing</Badge>
              <span className="text-[11px] text-muted-foreground">Being prepared</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-indigo-100 text-indigo-800 w-fit rounded-full text-[10px]">Shipped</Badge>
              <span className="text-[11px] text-muted-foreground">On the way</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-green-100 text-green-800 w-fit rounded-full text-[10px]">Delivered</Badge>
              <span className="text-[11px] text-muted-foreground">Arrived safely</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <Badge className="bg-red-100 text-red-800 w-fit rounded-full text-[10px]">Cancelled</Badge>
              <span className="text-[11px] text-muted-foreground">Order cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
