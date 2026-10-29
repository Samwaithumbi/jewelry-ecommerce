'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart } from '@/app/actions/cart/get-cart';
import { clearCart } from '@/app/actions/cart/clear-cart';
import { createOrderFromCart } from '@/app/actions/checkout/create-order';
import { Cart } from '@/types/cart';
import { MpesaPaymentForm } from '@/components/checkout/MpesaPaymentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, MapPin, Phone, Mail, CreditCard, Package, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch session without requiring SessionProvider
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { if (s?.user?.id) setUserId(s.user.id) })
      .catch(() => {})
  }, [])

  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Kenya',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Gift options state
  const [giftOptions, setGiftOptions] = useState({
    isGiftWrap: false,
    giftMessage: '',
    shipAsGift: false,
  });

  const GIFT_WRAP_COST = 10000;

  useEffect(() => {
    const fetchCart = async () => {
      const fetchedCart = await getCart();
      setCart(fetchedCart);
      setLoading(false);
    };

    fetchCart();
  }, []);

  const formatKsh = (cents: number) => {
    const ksh = (cents || 0) / 100;
    if (ksh > 0 && ksh < 1) {
      return ksh.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return ksh.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const totalItems = cart?.items.reduce((acc, item) => acc + item.qty, 0) || 0;
  const subtotal = cart?.items.reduce((acc, item) => acc + (((item.priceAtAdd ?? (item as any).price) || 0) * item.qty), 0) || 0;
  const shipping = 0; // Free shipping
  const giftWrapCost = giftOptions.isGiftWrap ? GIFT_WRAP_COST : 0;
  const tax = Math.round((subtotal + giftWrapCost) * 0.16); // 16% VAT
  const total = subtotal + shipping + giftWrapCost + tax;

  // Validate shipping form
  const validateShippingForm = () => {
    const errors: Record<string, string> = {};

    if (!shippingForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!shippingForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!shippingForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingForm.email)) {
      errors.email = 'Invalid email address';
    }
    if (!shippingForm.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!shippingForm.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingForm.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle shipping form submission
  const handleShippingSubmit = () => {
    if (validateShippingForm()) {
      setCurrentStep('payment');
    } else {
      toast.error('Please fill in all required shipping fields');
    }
  };

  const [priceChanged, setPriceChanged] = useState(false);
  const [priceChangesList, setPriceChangesList] = useState<any[]>([]);

  // Create order when moving to payment
  const handleCreateOrder = async (confirmed = false) => {
    setOrderLoading(true);
    setOrderError(null);
    if (!confirmed) {
      setPriceChanged(false);
      setPriceChangesList([]);
    }

    try {
      const result = await createOrderFromCart(userId, shippingForm, giftOptions, {
        confirmedPriceChanges: confirmed,
      });
      
      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        setPriceChanged(false);
      } else if (result.priceChanged) {
        setPriceChanged(true);
        setPriceChangesList(result.priceChanges || []);
        setOrderError(result.error || 'Prices have changed since items were added to your cart.');
        toast.warning('Item prices have been updated. Please confirm to proceed.');
        // Refresh cart in state to reflect updated prices
        const refreshedCart = await getCart();
        setCart(refreshedCart);
      } else {
        setOrderError(result.error || 'Failed to create order');
        toast.error(result.error || 'Failed to create order');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create order';
      setOrderError(msg);
      toast.error(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 'payment' && cart && cart.items.length > 0 && !orderId && !orderLoading) {
      handleCreateOrder();
    }
  }, [currentStep, cart, orderId, orderLoading]);

  // Handle payment success
  const handlePaymentSuccess = (paymentId: string) => {
    const successPath = `/checkout/success?orderId=${orderId}`;
    router.push(successPath);
  };

  // Handle payment failure
  const handlePaymentFailure = (error: string) => {
    router.push(`/checkout/failure?error=${encodeURIComponent(error)}${orderId ? `&orderId=${orderId}` : ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#B88E2F] mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some beautiful jewelry to get started</p>
          <Link href="/products">
            <Button className="bg-[#B88E2F] hover:bg-[#9a7a29] text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'shipping', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Check },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/products" className="inline-flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to products
          </Link>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-gray-900 mb-1 sm:mb-2">Checkout</h1>
          <p className="text-xs sm:text-sm text-gray-600">Complete your order in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              const isCurrent = step.id === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 transition-all
                      ${isCompleted ? 'bg-[#B88E2F] text-white shadow-xs' : isCurrent ? 'bg-[#B88E2F] text-white shadow-xs' : 'bg-gray-200 text-gray-400'}
                    `}>
                      {isCompleted ? <Check className="h-4 w-4 sm:h-6 sm:w-6" /> : <StepIcon className="h-4 w-4 sm:h-6 sm:w-6" />}
                    </div>
                    <span className={`text-[11px] sm:text-sm font-medium ${isCurrent ? 'text-[#B88E2F]' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 sm:mx-4 ${isCompleted ? 'bg-[#B88E2F]' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Form */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <MapPin className="h-6 w-6 text-[#B88E2F] mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={shippingForm.fullName}
                      onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                      placeholder="John Doe"
                      className={formErrors.fullName ? 'border-red-500' : ''}
                    />
                    {formErrors.fullName && <p className="text-sm text-red-500 mt-1">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      placeholder="0712345678"
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                      placeholder="123 Main Street"
                      className={formErrors.address ? 'border-red-500' : ''}
                    />
                    {formErrors.address && <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>}
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      placeholder="Nairobi"
                      className={formErrors.city ? 'border-red-500' : ''}
                    />
                    {formErrors.city && <p className="text-sm text-red-500 mt-1">{formErrors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={shippingForm.postalCode}
                      onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                      placeholder="00100"
                      className={formErrors.postalCode ? 'border-red-500' : ''}
                    />
                    {formErrors.postalCode && <p className="text-sm text-red-500 mt-1">{formErrors.postalCode}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                      disabled
                    />
                  </div>
                </div>

                {/* Gift Options */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gift Options</h3>
                  
                  {/* Gift Wrapping */}
                  <div className="flex items-start gap-4 mb-4">
                    <input
                      type="checkbox"
                      id="giftWrap"
                      checked={giftOptions.isGiftWrap}
                      onChange={(e) => setGiftOptions({ ...giftOptions, isGiftWrap: e.target.checked })}
                      className="mt-1 h-5 w-5 text-[#B88E2F] rounded border-gray-300 focus:ring-[#B88E2F]"
                    />
                    <div className="flex-1">
                      <Label htmlFor="giftWrap" className="font-medium text-gray-900">
                        Gift Wrapping (+Ksh {(GIFT_WRAP_COST / 100).toFixed(2)})
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Premium gift box with ribbon 
                      </p>
                    </div>
                  </div>

                  {/* Gift Message */}
                  {giftOptions.isGiftWrap && (
                    <div className="mb-4">
                      <Label htmlFor="giftMessage" className="font-medium text-gray-900">
                        Gift Message (optional, max 200 characters)
                      </Label>
                      <textarea
                        id="giftMessage"
                        value={giftOptions.giftMessage}
                        onChange={(e) => setGiftOptions({ ...giftOptions, giftMessage: e.target.value.slice(0, 200) })}
                        placeholder="Write a personal message for the recipient..."
                        rows={3}
                        maxLength={200}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {giftOptions.giftMessage.length}/200
                      </p>
                    </div>
                  )}

                  {/* Ship as Gift */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id="shipAsGift"
                      checked={giftOptions.shipAsGift}
                      onChange={(e) => setGiftOptions({ ...giftOptions, shipAsGift: e.target.checked })}
                      className="mt-1 h-5 w-5 text-[#B88E2F] rounded border-gray-300 focus:ring-[#B88E2F]"
                    />
                    <div className="flex-1">
                      <Label htmlFor="shipAsGift" className="font-medium text-gray-900">
                        Ship as Gift
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Hide price from packing slip and ship directly to recipient
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleShippingSubmit}
                    className="bg-[#B88E2F] hover:bg-[#9a7a29] text-white px-8"
                    size="lg"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Form */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <CreditCard className="h-6 w-6 text-[#B88E2F] mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                </div>

                {orderError ? (
                  <div className={`p-4 rounded-md mb-6 ${priceChanged ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <p className="font-semibold text-base mb-1">
                      {priceChanged ? 'Price Update Required' : 'Order Creation Failed'}
                    </p>
                    <p className="text-sm mb-3">{orderError}</p>

                    {priceChanged && priceChangesList.length > 0 && (
                      <div className="bg-white/80 rounded border border-amber-200 p-3 mb-3 text-xs divide-y divide-amber-100">
                        {priceChangesList.map((pc, idx) => (
                          <div key={idx} className="py-1.5 flex justify-between items-center">
                            <span className="font-medium text-gray-800">{pc.name}</span>
                            <span className="space-x-2">
                              <span className="line-through text-gray-400">KSh {(pc.oldPriceCents / 100).toLocaleString()}</span>
                              <span className="font-bold text-amber-800">→ KSh {(pc.newPriceCents / 100).toLocaleString()}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {priceChanged ? (
                        <Button
                          onClick={() => handleCreateOrder(true)}
                          className="bg-[#B88E2F] hover:bg-[#9a7a29] text-white"
                          size="sm"
                        >
                          Accept Updated Prices & Continue
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleCreateOrder(false)}
                          variant="outline"
                          size="sm"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                ) : orderLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-[#B88E2F] mb-4" />
                    <p className="text-gray-600">Creating your order...</p>
                  </div>
                ) : orderId ? (
                  <MpesaPaymentForm
                    orderId={orderId}
                    amountCents={total}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-[#B88E2F] mb-4" />
                    <p className="text-gray-600">Initializing payment...</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={() => setCurrentStep('shipping')}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Shipping
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <Package className="h-6 w-6 text-[#B88E2F] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {cart.items.map((item, i) => (
                  <div key={`${item.productId}-${item.variantId || i}`} className="flex items-start space-x-3 pb-4 border-b">
                    <div className="h-16 w-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                        <p className="font-medium text-gray-900">
                          KSh {formatKsh(((item.priceAtAdd ?? (item as any).price) || 0) * item.qty)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">KSh {formatKsh(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                {giftOptions.isGiftWrap && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gift Wrapping</span>
                    <span className="font-medium">KSh {formatKsh(giftWrapCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (16%)</span>
                  <span className="font-medium">KSh {formatKsh(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-[#B88E2F]">KSh {formatKsh(total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">Secure Payment</p>
                    <p>Your payment information is safe and encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
