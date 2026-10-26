"use server";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/drizzle/src/db/schema";
import { hashPassword } from "@/lib/password";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export async function resetPasswordWithToken(input: ResetPasswordInput) {
  try {
    const validated = resetPasswordSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }

    const { email, token, password } = validated.data;
    const normalizedEmail = email.toLowerCase();

    // Look up token in database
    const tokenRecord = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.email, normalizedEmail),
        eq(passwordResetTokens.token, token)
      ),
    });

    if (!tokenRecord) {
      return {
        success: false,
        error: "This reset link is invalid or has already been used.",
      };
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      // Clean up expired token
      await db.delete(passwordResetTokens).where(
        eq(passwordResetTokens.id, tokenRecord.id)
      );
      return {
        success: false,
        error: "This reset link has expired. Please request a new password reset.",
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and ensure emailVerified is set
    await db.update(users).set({
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    }).where(eq(users.email, normalizedEmail));

    // Delete used token
    await db.delete(passwordResetTokens).where(
      eq(passwordResetTokens.id, tokenRecord.id)
    );

    return {
      success: true,
      message: "Your password has been reset successfully! You can now sign in with your new password.",
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again.",
    };
  }
}
