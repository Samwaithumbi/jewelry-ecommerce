'use client';

/**
 * Checkout Success Page
 * 
 * This page displays after a successful payment.
 * It shows order confirmation and next steps.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, Home, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  qty: number;
  priceCents: number;
  productName: string;
  productSlug: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B88E2F] mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for your order. We have received your payment and will begin processing your order immediately.
            </p>
          </div>

          {order && (
            <div className="space-y-6">
              {/* Order Number */}
              <div className="bg-[#B88E2F]/10 border border-[#B88E2F]/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-bold text-[#B88E2F]">{order.orderNumber}</span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${((item.priceCents * item.qty) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${(order.subtotalCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (16%)</span>
                    <span>${(order.taxCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#B88E2F]">${(order.totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#B88E2F]" />
                  Shipping Address
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.email}</p>
                  <p className="text-sm text-gray-600 mt-2">{order.shippingAddress.address}</p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 text-center">What's Next?</h3>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• Order confirmation email sent</li>
            <li>• Order processing within 24 hours</li>
            <li>• Shipping notification via email</li>
            <li>• Track your order in your account</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/shop/products" className="block">
            <Button className="w-full" size="lg">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact our support team
        </p>
      </div>
    </div>
  );
}
