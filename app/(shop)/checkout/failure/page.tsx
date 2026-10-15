'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { updatePaymentStatus } from '@/app/actions/checkout/order-error';

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorParam = searchParams.get('error') || 'Payment failed or expired. Please try again.';
  const orderId = searchParams.get('orderId');
  const [failureReason, setFailureReason] = useState<string>(errorParam);
  const [checkingRecovery, setCheckingRecovery] = useState(!!orderId);
  const hasNotifiedRef = useRef(false);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 10; // 30 seconds total

  // Poll payment status briefly — Daraja sometimes retries callbacks seconds after
  // the frontend detects a failure, and the order may resolve to SUCCESS.
  useEffect(() => {
    if (!orderId) {
      setCheckingRecovery(false);
      return;
    }

    // Fetch latest payment for this order from the payments API
    const poll = async () => {
      try {
        // Check the latest payment status via the order's payment records
        const res = await fetch(`/api/payments/by-order/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.status === 'success') {
            // Payment actually succeeded — redirect to success page
            router.replace(`/checkout/success?orderId=${orderId}`);
            return true;
          }
        }
      } catch {
        // Ignore polling errors
      }
      return false;
    };

    let interval: NodeJS.Timeout;
    const startPolling = () => {
      interval = setInterval(async () => {
        pollCountRef.current += 1;
        const resolved = await poll();
        if (resolved || pollCountRef.current >= MAX_POLLS) {
          clearInterval(interval);
          setCheckingRecovery(false);
          // Only then call updatePaymentStatus to cancel pending payments
          if (!resolved && orderId && !hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            updatePaymentStatus(orderId, 'cancelled', errorParam)
              .then((res) => {
                if (res?.reason) setFailureReason(res.reason);
              })
              .catch((err) => console.error('Failed to sync order failure status:', err));
          }
        }
      }, 3000);
    };

    // Brief initial check then start polling
    poll().then((resolved) => {
      if (resolved) return;
      setCheckingRecovery(true);
      startPolling();
    });

    return () => clearInterval(interval);
  }, [orderId, errorParam, router]);

  if (checkingRecovery) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Verifying payment status...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 mb-6">
            We were unable to process your payment.
          </p>

          {/* Stating the specific reason for the failure instead of listing generic reasons */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
            <div className="flex items-center space-x-2 mb-1.5">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-800">
                Reason for Failure
              </span>
            </div>
            <p className="text-sm font-medium text-red-700 pl-6">
              {failureReason}
            </p>
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