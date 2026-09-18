'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getStatusLabel, 
  getStatusColor, 
  OrderStatus 
} from '@/lib/order-status';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Truck, 
  Clock,
  CheckCircle,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';

interface OrderItem {
  id: string;
  qty: number;
  priceCents: number;
  productId: string;
  productName: string;
  productSlug: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingAddress: any;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getStatusTimeline = () => {
    if (!order) return [];

    const timeline = [
      { 
        status: 'pending', 
        label: 'Order Placed', 
        date: order.createdAt,
        completed: true 
      },
      { 
        status: 'confirmed', 
        label: 'Order Confirmed', 
        date: order.createdAt,
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) 
      },
      { 
        status: 'processing', 
        label: 'Processing', 
        date: null,
        completed: ['processing', 'shipped', 'delivered'].includes(order.status) 
      },
      { 
        status: 'shipped', 
        label: 'Shipped', 
        date: order.shippedAt,
        completed: ['shipped', 'delivered'].includes(order.status) 
      },
      { 
        status: 'delivered', 
        label: 'Delivered', 
        date: order.deliveredAt,
        completed: order.status === 'delivered' 
      },
    ];

    if (order.status === 'cancelled') {
      return [
        { 
          status: 'pending', 
          label: 'Order Placed', 
          date: order.createdAt,
          completed: true 
        },
        { 
          status: 'cancelled', 
          label: 'Cancelled', 
          date: order.createdAt,
          completed: true 
        },
      ];
    }

    return timeline;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Order not found</h3>
          <a href="/account/orders">
            <Button className="mt-4">
              Back to Orders
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const timeline = getStatusTimeline();
  const address = order.shippingAddress || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <a href="/account/orders">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </a>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order {order.orderNumber}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-base px-4 py-2`} variant="secondary">
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">
                        ${formatCurrency(item.priceCents)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${formatCurrency(item.priceCents * item.qty)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Summary */}
              <div className="mt-6 space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${formatCurrency(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">${formatCurrency(order.shippingCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${formatCurrency(order.taxCents)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>${formatCurrency(order.totalCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => (
                  <div key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-10 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-base">{step.label}</div>
                      {step.date && (
                        <div className="text-sm text-muted-foreground">
                          {formatDate(step.date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium text-lg">{address.name}</div>
                <div className="text-muted-foreground">{address.address}</div>
                <div className="text-muted-foreground">{address.city}, {address.postalCode}</div>
                <div className="text-muted-foreground">{address.country}</div>
                {address.phone && (
                  <div className="text-muted-foreground mt-2">{address.phone}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Track Your Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Carrier</div>
                  <div className="font-medium">{order.carrier}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tracking Number</div>
                  <div className="font-medium font-mono">{order.trackingNumber}</div>
                </div>
                <a
                  href={getTrackingUrl(order.trackingNumber, order.carrier || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Track Package
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Need Help */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Have questions about your order? We're here to help.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
