CREATE TYPE "public"."custom_request_status" AS ENUM('pending', 'reviewing', 'quoted', 'approved', 'rejected', 'completed');--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "payments_expires_idx" ON "payments" USING btree ("expires_at");