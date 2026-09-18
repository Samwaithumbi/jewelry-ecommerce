"use server"

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const sql = neon(process.env.DATABASE_URL!);

export interface Reminder {
  id: string;
  type: 'birthday' | 'anniversary';
  reminderDate: string;
  recipientName: string;
  emailSent: boolean;
}

export async function getReminders(): Promise<Reminder[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  try {
    const reminders = await sql`
      SELECT id, type, reminder_date, recipient_name, email_sent
      FROM reminders
      WHERE user_id = ${session.user.id}
      ORDER BY reminder_date ASC
    `;

    return reminders.map((r: any) => ({
      id: r.id,
      type: r.type,
      reminderDate: r.reminder_date,
      recipientName: r.recipient_name,
      emailSent: r.email_sent,
    }));
  } catch (error) {
    console.error('Failed to get reminders:', error);
    return [];
  }
}

export async function addReminder(type: string, date: string, recipientName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to add reminders');
  }

  try {
    await sql`
      INSERT INTO reminders (id, user_id, type, reminder_date, recipient_name)
      VALUES (${randomUUID()}, ${session.user.id}, ${type}, ${date}, ${recipientName})
    `;

    return { success: true };
  } catch (error) {
    console.error('Failed to add reminder:', error);
    throw new Error('Failed to add reminder');
  }
}

export async function removeReminder(reminderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to remove reminders');
  }

  try {
    await sql`
      DELETE FROM reminders 
      WHERE id = ${reminderId} 
      AND user_id = ${session.user.id}
    `;

    return { success: true };
  } catch (error) {
    console.error('Failed to remove reminder:', error);
    throw new Error('Failed to remove reminder');
  }
}
