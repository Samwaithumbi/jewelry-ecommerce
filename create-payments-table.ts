import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createPaymentsTable() {
  try {
    console.log('Creating payment_status enum...');
    await sql`CREATE TYPE IF NOT EXISTS "payment_status" AS ENUM('pending', 'success', 'failed', 'cancelled')`;
    
    console.log('Creating payments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" uuid NOT NULL,
        "provider" varchar(50) NOT NULL,
        "amount_cents" integer NOT NULL,
        "phone_number" varchar(20) NOT NULL,
        "status" "payment_status" DEFAULT 'pending' NOT NULL,
        "merchant_request_id" varchar(100),
        "checkout_request_id" varchar(100),
        "mpesa_receipt_number" varchar(50),
        "result_code" varchar(10),
        "result_description" text,
        "transaction_date" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "payments_checkout_request_id_unique" UNIQUE("checkout_request_id")
      )
    `;
    
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "payments_order_idx" ON "payments" ("order_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status")`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "payments_checkout_req_idx" ON "payments" ("checkout_request_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "payments_merchant_req_idx" ON "payments" ("merchant_request_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "payments_mpesa_receipt_idx" ON "payments" ("mpesa_receipt_number")`;
    
    console.log('✅ Payments table created successfully!');
  } catch (error) {
    console.error('❌ Error creating payments table:', error);
    process.exit(1);
  }
}

createPaymentsTable();
