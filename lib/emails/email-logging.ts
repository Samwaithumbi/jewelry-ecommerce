/**
 * Email Logging Helper
 * 
 * Logs all email sends for tracking and debugging
 */

import { db } from '@/lib/db';
import { emailLogs } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';

export interface EmailLogData {
  orderId?: string;
  type: 'confirmation' | 'shipped' | 'delivered' | 'failed';
  status: 'sent' | 'failed' | 'retrying';
  to: string;
  error?: string;
  retryCount?: number;
}

/**
 * Log an email send attempt
 * 
 * @param data - Email log data
 * @returns Created log record
 */
export async function logEmailSend(data: EmailLogData) {
  try {
    const log = await db.insert(emailLogs).values({
      orderId: data.orderId,
      type: data.type,
      status: data.status,
      to: data.to,
      error: data.error,
      sentAt: data.status === 'sent' ? new Date() : null,
      retryCount: data.retryCount || 0,
    }).returning();

    return log[0];
  } catch (error) {
    console.error('Failed to log email send:', error);
    // Don't throw - logging failure shouldn't break the flow
    return null;
  }
}

/**
 * Update email log status
 * 
 * @param logId - Log ID
 * @param status - New status
 * @param error - Optional error message
 */
export async function updateEmailLogStatus(
  logId: string,
  status: 'sent' | 'failed' | 'retrying',
  error?: string
) {
  try {
    await db
      .update(emailLogs)
      .set({
        status,
        error,
        sentAt: status === 'sent' ? new Date() : null,
      })
      .where(eq(emailLogs.id, logId));
  } catch (error) {
    console.error('Failed to update email log:', error);
  }
}

/**
 * Get email logs for an order
 * 
 * @param orderId - Order ID
 * @returns Array of email logs
 */
export async function getEmailLogsForOrder(orderId: string) {
  try {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.orderId, orderId))
      .orderBy(emailLogs.createdAt);

    return logs;
  } catch (error) {
    console.error('Failed to get email logs:', error);
    return [];
  }
}

/**
 * Get recent failed emails for admin monitoring
 * 
 * @param limit - Maximum number of logs to return
 * @returns Array of failed email logs
 */
export async function getFailedEmails(limit: number = 50) {
  try {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.status, 'failed'))
      .orderBy(emailLogs.createdAt)
      .limit(limit);

    return logs;
  } catch (error) {
    console.error('Failed to get failed emails:', error);
    return [];
  }
}
