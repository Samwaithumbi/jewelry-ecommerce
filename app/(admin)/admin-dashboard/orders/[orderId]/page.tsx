'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getStatusLabel, 
  getStatusColor, 
  OrderStatus,
  getNextValidStatuses 
} from '@/lib/order-status';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Truck, 
  Clock,
  CheckCircle,
  FileText,
  ExternalLink
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
        setNewStatus(data.order.status);
        setTrackingNumber(data.order.trackingNumber || '');
        setCarrier(data.order.carrier || '');
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

  const handleStatusUpdate = async () => {
    if (!newStatus || !order) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: [orderId],
          status: newStatus,
          trackingNumber: newStatus === 'shipped' ? trackingNumber : undefined,
          carrier: newStatus === 'shipped' ? carrier : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchOrder();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="p-6">
        <div className="text-center py-8">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Order not found</div>
      </div>
    );
  }

  const timeline = getStatusTimeline();
  const address = order.shippingAddress || {};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <a href="/admin/admin-dashboard/orders">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Order {order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)} variant="secondary">
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
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.productId.slice(0, 8)}...
                        </div>
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
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.label}</div>
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
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus || '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextValidStatuses(order.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'shipped' && (
                <>
                  <div>
                    <Label>Tracking Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <Label>Carrier</Label>
                    <Input
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g., FedEx, UPS, DHL"
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleStatusUpdate} 
                disabled={updating || !newStatus || newStatus === order.status}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{address.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{address.email || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{address.phone || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-medium">{address.name}</div>
                <div>{address.address}</div>
                <div>{address.city}, {address.postalCode}</div>
                <div>{address.country}</div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm text-muted-foreground">Carrier</div>
                  <div className="font-medium">{order.carrier}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tracking Number</div>
                  <div className="font-medium">{order.trackingNumber}</div>
                </div>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track Package
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Shipping Label */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shipping Label
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled={!order.trackingNumber}>
                {order.trackingNumber ? 'Print Label' : 'Add tracking first'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
