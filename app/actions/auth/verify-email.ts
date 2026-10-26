"use server";

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/drizzle/src/db/schema";
import { eq, and } from "drizzle-orm";

interface VerifyEmailParams {
  email: string;
  token: string;
}

export async function verifyEmailToken({ email, token }: VerifyEmailParams) {
  try {
    if (!email || !token) {
      return { success: false, error: "Missing verification credentials." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up token
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, normalizedEmail),
        eq(verificationTokens.token, token)
      ),
    });

    if (!tokenRecord) {
      return {
        success: false,
        error: "This verification link is invalid or has already been used.",
      };
    }

    if (new Date(tokenRecord.expires) < new Date()) {
      // Clean up expired token
      await db.delete(verificationTokens).where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, token)
        )
      );
      return {
        success: false,
        error: "This verification link has expired. Please request a new one.",
      };
    }

    // Mark email as verified
    await db.update(users).set({
      emailVerified: new Date(),
    }).where(eq(users.email, normalizedEmail));

    // Delete token after successful verification
    await db.delete(verificationTokens).where(
      and(
        eq(verificationTokens.identifier, normalizedEmail),
        eq(verificationTokens.token, token)
      )
    );

    return {
      success: true,
      message: "Your email has been successfully verified! You may now access all member privileges.",
    };
  } catch (error: any) {
    console.error("Error verifying email token:", error);
    return {
      success: false,
      error: error?.message || "An error occurred while verifying your email.",
    };
  }
}
