CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP INDEX "payments_mpesa_receipt_idx";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
CREATE INDEX "pwd_reset_email_idx" ON "password_reset_tokens" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "pwd_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_mpesa_receipt_idx" ON "payments" USING btree ("mpesa_receipt_number");