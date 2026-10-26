"use server";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/drizzle/src/db/schema";
import { sendPasswordResetEmail } from "@/lib/emails/email";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function requestPasswordReset(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate-limiting check with Redis if available
    try {
      const { redis } = await import("@/lib/redis");
      const rateLimitKey = `pwd_reset_rate:${normalizedEmail}`;
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
        // Set expiry for 1 hour
        await redis.expire(rateLimitKey, 3600);
      } else if (count > 5) {
        return {
          success: false,
          error: "Too many password reset requests. Please wait an hour before trying again.",
        };
      }
    } catch {
      // Redis optional in development
    }

    // Check user in database
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (user) {
      // Invalidate existing reset tokens for this email
      await db.delete(passwordResetTokens).where(
        eq(passwordResetTokens.email, normalizedEmail)
      );

      // Generate secure 32-byte random hex token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        email: normalizedEmail,
        token,
        expiresAt,
      });

      // Send branded password reset email
      try {
        await sendPasswordResetEmail({
          customerEmail: normalizedEmail,
          customerName: user.name || "Customer",
          token,
        });
      } catch (mailErr) {
        console.error("Failed to send password reset email:", mailErr);
      }
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message: "If an account is associated with this email, we have sent instructions to reset your password.",
    };
  } catch (error: any) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again.",
    };
  }
}
