"use server";

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/drizzle/src/db/schema";
import { sendAccountVerificationEmail } from "@/lib/emails/email";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function resendVerificationEmail(email: string) {
  try {
    if (!email) {
      return { success: false, error: "Please enter your email address." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      // Don't disclose if user exists
      return {
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      };
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: "This email address is already verified. You can sign in directly.",
        alreadyVerified: true,
      };
    }

    // Remove any existing tokens for this email
    await db.delete(verificationTokens).where(
      eq(verificationTokens.identifier, normalizedEmail)
    );

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      identifier: normalizedEmail,
      token,
      expires,
    });

    // Send email
    await sendAccountVerificationEmail({
      customerEmail: normalizedEmail,
      customerName: user.name || "Customer",
      token,
    });

    return {
      success: true,
      message: "A fresh verification link has been sent to your email.",
    };
  } catch (error: any) {
    console.error("Error resending verification email:", error);
    return {
      success: false,
      error: error?.message || "Failed to resend verification email. Please try again.",
    };
  }
}
