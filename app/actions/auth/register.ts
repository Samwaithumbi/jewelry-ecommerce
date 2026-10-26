"use server";

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/drizzle/src/db/schema";
import { hashPassword } from "@/lib/password";
import { sendAccountVerificationEmail } from "@/lib/emails/email";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerCustomer(input: RegisterInput) {
  try {
    const validated = registerSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }

    const { firstName, lastName, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      if (existingUser.passwordHash) {
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        };
      } else {
        return {
          success: false,
          error: "An account with this email was created with Google or Magic Link. Please sign in with that method.",
        };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique referral code
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const referralCode = `LUM-${randomSuffix}`;

    // Create user
    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      name: `${firstName} ${lastName}`.trim(),
      passwordHash: hashedPassword,
      role: "customer",
      customerTier: "standard",
      referralCode,
      loyaltyBalance: 50, // 50 welcome points
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

    // Generate verification token (expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      identifier: normalizedEmail,
      token: verificationToken,
      expires,
    });

    // Send verification email
    try {
      await sendAccountVerificationEmail({
        customerEmail: normalizedEmail,
        customerName: firstName,
        token: verificationToken,
      });
    } catch (emailErr) {
      console.warn("Failed to send welcome verification email:", emailErr);
    }

    return {
      success: true,
      message: "Account created successfully! We sent a verification link to your email.",
      user: newUser,
    };
  } catch (error: any) {
    console.error("Error during customer registration:", error);
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again.",
    };
  }
}
