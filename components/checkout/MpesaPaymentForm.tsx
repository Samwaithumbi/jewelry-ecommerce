'use client';

/**
 * M-PESA Payment Form Component
 * 
 * This component provides a polished UI for M-PESA payments.
 * It handles:
 * - Phone number input with validation
 * - Payment initiation
 * - Status polling
 * - Success/failure states
 * - Retry functionality
 * 
 * SECURITY:
 * - Amount is displayed from props, never editable
 * - Payment status is determined by backend only
 * - No sensitive credentials are exposed
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface MpesaPaymentFormProps {
  orderId: string;
  amountCents: number;
  onSuccess?: (paymentId: string) => void;
  onFailure?: (error: string) => void;
}

type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';

export function MpesaPaymentForm({
  orderId,
  amountCents,
  onSuccess,
  onFailure,
}: MpesaPaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Poll for payment status when pending
  useEffect(() => {
    if (status !== 'pending' || !paymentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}`);
        const data = await response.json();

        if (data.success) {
          if (data.status === 'success') {
            setStatus('success');
            onSuccess?.(paymentId);
            clearInterval(pollInterval);
          }
        } else {
          // Handle failed/cancelled payments from API
          if (data.status === 'cancelled' || data.status === 'failed') {
            setStatus(data.status);
            setError(data.error || 'Payment failed. Please try again.');
            onFailure?.(data.error || 'Payment failed');
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Timeout after 15 minutes (matches payment expiry)
    const timeout = setTimeout(() => {
      if (status === 'pending') {
        setStatus('failed');
        setError('Payment timed out. Please try again.');
        onFailure?.('Payment timed out');
        clearInterval(pollInterval);
      }
    }, 15 * 60 * 1000);

    // Countdown timer
    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
      clearInterval(countdown);
    };
  }, [status, paymentId, onSuccess, onFailure]);

  const formatAmount = (cents: number) => {
    return `KSh ${(cents / 100).toLocaleString()}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for Kenyan phone numbers
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  };

  const handleInitiatePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }

    setStatus('initiating');
    setError(null);

    try {
      const response = await fetch('/api/payments/mpesa/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentId(data.paymentId);
        setStatus('pending');
        setTimeRemaining(900); // 15 minutes
      } else {
        setStatus('failed');
        setError(data.error || 'Failed to initiate payment');
        onFailure?.(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setStatus('failed');
      setError('Network error. Please check your connection and try again.');
      onFailure?.('Network error');
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
    setPaymentId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Idle state - show input form
  if (status === 'idle') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">M-PESA Payment</CardTitle>
          <CardDescription>
            Enter your M-PESA phone number to complete payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={status !== 'idle'}
            />
            <p className="text-xs text-muted-foreground">
              Format: 07XXXXXXXX or +2547XXXXXXXX
            </p>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="text-3xl font-bold">{formatAmount(amountCents)}</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleInitiatePayment}
            disabled={!phoneNumber || status !== 'idle'}
            className="w-full"
            size="lg"
          >
            Pay with M-PESA
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Initiating state
  if (status === 'initiating') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">Initiating Payment</p>
              <p className="text-sm text-muted-foreground">
                Sending STK Push to your phone...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending state - waiting for user to complete payment
  if (status === 'pending') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">M-PESA Prompt Sent</p>
              <p className="text-sm text-muted-foreground">
                Check your phone and enter your M-PESA PIN
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{formatAmount(amountCents)}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Time remaining</p>
              <p className="text-xl font-semibold">{formatTime(timeRemaining)}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Do not close this page
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900">Payment Successful!</p>
              <p className="text-sm text-green-700">
                Your payment has been confirmed
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold">{formatAmount(amountCents)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed/Cancelled state
  if (status === 'failed' || status === 'cancelled') {
    return (
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-red-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900">
                {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>

            <Button
              onClick={handleRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
