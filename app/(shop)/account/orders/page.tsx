'use client';

import { useEffect, useState } from 'react';
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
  Calendar
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
    return (cents / 100).toFixed(2);
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track and manage your order history
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <a href="/products">
              <Button className="bg-[#111827] text-white hover:bg-[#111827]/90">
                Browse Products
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${formatCurrency(order.totalCents)}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <a
                            href={getTrackingUrl(order.trackingNumber, order.carrier || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                            >
                              <Truck className="h-3 w-3" />
                              <span className="text-xs">{order.trackingNumber}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {order.status === 'shipped' || order.status === 'delivered'
                              ? 'Tracking unavailable'
                              : 'Not shipped yet'
                            }
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={`/account/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="mr-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                          View
                        </a>
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Order Status Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              <span className="text-muted-foreground">Order received</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
              <span className="text-muted-foreground">Payment verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Processing</Badge>
              <span className="text-muted-foreground">Being prepared</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-800">Shipped</Badge>
              <span className="text-muted-foreground">On the way</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Delivered</Badge>
              <span className="text-muted-foreground">Arrived safely</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
              <span className="text-muted-foreground">Order cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
