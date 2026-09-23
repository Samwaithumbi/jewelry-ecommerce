'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Payment failed or expired. Please try again.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-8">
            {error}
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-red-700">
              Your payment could not be processed. This could be due to:
            </p>
            <ul className="text-left text-sm text-red-600 mt-2 space-y-1">
              <li>• Payment timed out (15 minutes)</li>
              <li>• Insufficient funds</li>
              <li>• Transaction cancelled by user</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>

          <div className="space-y-3">
            {orderId && (
              <Link href={`/checkout?orderId=${orderId}`} className="block">
                <Button className="w-full" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Payment
                </Button>
              </Link>
            )}
            <Link href="/shop/cart" className="block">
              <Button variant="outline" className="w-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Cart
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact our support team
        </p>
      </div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={<CheckoutFailureFallback />}>
      <CheckoutFailureContent />
    </Suspense>
  );
}

function CheckoutFailureFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}