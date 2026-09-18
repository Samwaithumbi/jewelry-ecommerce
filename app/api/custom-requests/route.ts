import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sendCustomRequestNotification } from '@/lib/email';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL!);

// POST /api/custom-requests - Submit a custom request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      description,
      budgetMinCents,
      budgetMaxCents,
      metalPreference,
      timeline,
      photoUrls,
    } = body;

    // Validation
    if (!name || !email || !description) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and description are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Insert custom request using raw SQL (since schema not updated yet)
    const requestId = randomUUID();
    const result = await sql`
      INSERT INTO custom_requests (
        id, user_id, name, email, phone, description, 
        budget_min_cents, budget_max_cents, metal_preference, 
        timeline, photo_urls, status
      ) VALUES (
        ${requestId}, NULL, ${name}, ${email}, ${phone || null}, ${description}, 
        ${budgetMinCents || null}, ${budgetMaxCents || null}, ${metalPreference || null}, 
        ${timeline || null}, ${JSON.stringify(photoUrls || [])}, 'pending'
      )
      RETURNING *
    `;

    const customRequest = result[0];

    // Send admin notification email
    await sendCustomRequestNotification({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      description,
      budgetMin: budgetMinCents ? (budgetMinCents / 100).toString() : undefined,
      budgetMax: budgetMaxCents ? (budgetMaxCents / 100).toString() : undefined,
      metalPreference,
      timeline,
      photoUrls: photoUrls || [],
      requestId: customRequest.id as string,
    });

    return NextResponse.json({
      success: true,
      customRequest,
    });
  } catch (error) {
    console.error('Custom request submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
