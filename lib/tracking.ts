/**
 * Tracking URL Generator
 * 
 * Generates carrier-specific tracking URLs for order tracking
 */

/**
 * Generate tracking URL for a carrier and tracking number
 * 
 * @param carrier - Carrier name (FedEx, UPS, DHL, USPS, etc.)
 * @param trackingNumber - Tracking number
 * @returns Tracking URL
 */
export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const encodedNumber = encodeURIComponent(trackingNumber);
  
  switch (carrier.toLowerCase()) {
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${encodedNumber}`;
    
    case 'ups':
      return `https://www.ups.com/track?tracknum=${encodedNumber}`;
    
    case 'dhl':
      return `https://www.dhl.com/en/express/tracking.html?tracking-id=${encodedNumber}`;
    
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedNumber}`;
    
    case 'j&t':
    case 'jnt':
      return `https://www.jtexpress.co.ke/track-trace?shipmentid=${encodedNumber}`;
    
    case 'safaricom':
    case 'posta':
      return `https://www.posta.co.ke/track-and-trace?trackingnumber=${encodedNumber}`;
    
    default:
      // Fallback to Google search
      return `https://www.google.com/search?q=${encodedNumber}`;
  }
}

/**
 * Get estimated delivery days for a carrier
 * 
 * @param carrier - Carrier name
 * @returns Estimated delivery days or message
 */
export function getEstimatedDeliveryDays(carrier: string): string {
  switch (carrier.toLowerCase()) {
    case 'fedex':
      return 'Within 2-3 business days';
    
    case 'ups':
      return 'Within 2-3 business days';
    
    case 'dhl':
      return 'Within 2-4 business days';
    
    case 'usps':
      return 'Within 3-5 business days';
    
    case 'j&t':
    case 'jnt':
      return 'Within 3-5 business days';
    
    case 'safaricom':
    case 'posta':
      return 'Within 4-7 business days';
    
    default:
      return 'Within 3-5 business days';
  }
}

/**
 * Validate tracking number format (basic check)
 * 
 * @param trackingNumber - Tracking number
 * @returns true if valid, false otherwise
 */
export function isValidTrackingNumber(trackingNumber: string): boolean {
  // Tracking numbers are typically 8-20 alphanumeric characters
  return /^[A-Z0-9]{8,20}$/i.test(trackingNumber);
}
