/**
 * Kenyan Phone Number Normalization
 * 
 * This module handles validation and normalization of Kenyan phone numbers
 * for M-PESA payments. It accepts various common formats and normalizes them
 * to the format expected by Daraja API: 2547XXXXXXXX
 * 
 * Supported formats:
 * - 0712345678 (local format)
 * - 0722345678 (local format)
 * - 0112345678 (local format)
 * - 254712345678 (international format without +)
 * - +254712345678 (international format with +)
 */

import { z } from 'zod';
import { InvalidPhoneNumberError } from './errors';

/**
 * Zod schema for validating Kenyan phone numbers
 */
const kenyanPhoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be at most 20 characters') // Increased to allow spaces/dashes
  .refine((value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Check if it's a valid Kenyan number
    // Valid formats: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
    const kenyanPattern = /^(07|01|2547|2541)\d{7,8}$/;
    return kenyanPattern.test(digits);
  }, 'Invalid Kenyan phone number format');

/**
 * Normalize a Kenyan phone number to Daraja format (2547XXXXXXXX)
 * 
 * @param phoneNumber - Phone number in various formats
 * @returns Normalized phone number in format 2547XXXXXXXX
 * @throws InvalidPhoneNumberError if the phone number is invalid
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new InvalidPhoneNumberError(phoneNumber || 'empty');
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Validate with Zod schema (validate the original input, not just digits)
  try {
    kenyanPhoneSchema.parse(phoneNumber);
  } catch (error) {
    throw new InvalidPhoneNumberError(phoneNumber);
  }

  // Normalize to 2547XXXXXXXX format
  if (digits.startsWith('07')) {
    // Convert 07XXXXXXXX to 2547XXXXXXXX
    return '2547' + digits.substring(2);
  } else if (digits.startsWith('01')) {
    // Convert 01XXXXXXXX to 2541XXXXXXXX
    return '2541' + digits.substring(2);
  } else if (digits.startsWith('2547') || digits.startsWith('2541')) {
    // Already in international format
    return digits;
  } else {
    throw new InvalidPhoneNumberError(phoneNumber);
  }
}

/**
 * Validate a phone number without normalizing
 * 
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  try {
    normalizePhoneNumber(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format phone number for display (mask middle digits for privacy)
 * 
 * @param phoneNumber - Normalized phone number
 * @returns Formatted phone number like 2547***5678
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length !== 12) {
    return phoneNumber;
  }
  return phoneNumber.substring(0, 4) + '***' + phoneNumber.substring(7, 12);
}

/**
 * Extract carrier from phone number (for informational purposes)
 * 
 * Kenyan mobile prefixes:
 * - 07XX / 2547XX: Various carriers
 * - 01XX / 2541XX: Telkom Kenya
 * 
 * @param phoneNumber - Normalized phone number
 * @returns Carrier name or 'Unknown'
 */
export function getCarrier(phoneNumber: string): string {
  if (phoneNumber.startsWith('2541')) {
    return 'Telkom Kenya';
  }
  
  const prefix = phoneNumber.substring(4, 6);
  const carriers: Record<string, string> = {
    '10': 'Safaricom',
    '11': 'Safaricom',
    '12': 'Safaricom',
    '17': 'Safaricom',
    '18': 'Safaricom',
    '20': 'Airtel',
    '21': 'Airtel',
    '22': 'Airtel',
    '25': 'Airtel',
    '30': 'Telkom Kenya',
    '31': 'Telkom Kenya',
    '57': 'Faiba 4G',
    '58': 'Safaricom',
    '59': 'Safaricom',
  };
  
  return carriers[prefix] || 'Unknown';
}
