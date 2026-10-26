import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/drizzle/src/db/schema"
import { verifyPassword } from "@/lib/password"
import { Resend } from "resend"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import type { NextAuthOptions } from "next-auth"

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          throw new Error("No account found with this email.");
        }

        if (!user.passwordHash) {
          throw new Error("This account was created with Google or Magic Link. Please sign in using that method.");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM || "auth@lumina.jewelry",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          await resend.emails.send({
            from: provider.from!,
            to: identifier,
            subject: "Sign in to Lumina Jewels",
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #FAFAF7; border-radius: 12px; border: 1px solid #E8D5A0;">
                <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">Lumina Jewels</h1>
                <p style="color: #666; font-size: 14px; margin-top: 0;">Timeless Elegance & Exclusive Fine Jewelry</p>
                <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #f0f0f0;">
                  <h2 style="color: #333; font-size: 18px; margin-top: 0;">Sign in to your account</h2>
                  <p style="color: #555; line-height: 1.6; font-size: 14px;">Click the button below to sign in instantly. This secure link is valid for 24 hours.</p>
                  <div style="margin: 24px 0;">
                    <a href="${url}" style="padding: 12px 28px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #FAF7F2; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Sign In to Lumina</a>
                  </div>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">If you did not request this link, you can safely ignore this email.</p>
              </div>
            `,
          })
        } catch (error) {
          console.error("Failed to send magic link verification email:", error)
          throw new Error("Failed to send magic link email.")
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign_in",
    error: "/sign_in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (user?.email) {
        try {
          const normalizedEmail = user.email.toLowerCase();

          // Fetch authoritative user from database
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail),
          });

          // If signed in with Google, ensure emailVerified is marked
          if (account?.provider === "google" && dbUser) {
            if (!dbUser.emailVerified) {
              await db.update(users).set({
                emailVerified: new Date(),
              }).where(eq(users.id, dbUser.id));
            }
          }

          // Guest cart merging with valid PostgreSQL UUID
          const realUserId = dbUser?.id || (user.id && user.id.includes("-") ? user.id : null);
          if (realUserId) {
            const cookieStore = await cookies();
            const guestSessionId = cookieStore.get("guest_session")?.value;
            if (guestSessionId) {
              const { mergeCarts } = await import("@/app/actions/cart/merge-carts");
              await mergeCarts(guestSessionId, realUserId);
              try {
                cookieStore.delete("guest_session");
              } catch {
                // Ignore if headers already committed
              }
            }
          }
        } catch (error) {
          console.error("Error during post sign-in callback:", error);
        }
      }
      return true;
    },

    /**
     * Populate the JWT token with authoritative database user UUID and role.
     */
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (email) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
            columns: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          } else if (user) {
            token.id = user.id;
            if (user.role) token.role = user.role;
          }
        } catch (err) {
          console.error("Failed to fetch user role for JWT:", err);
          if (user) {
            token.id = user.id;
            if (user.role) token.role = user.role;
          }
        }
      } else if (user) {
        token.id = user.id;
        if (user.role) token.role = user.role;
      }
      return token;
    },

    /**
     * Expose id and role on the client-facing session object.
     */
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role as string;
        }
      }
      return session;
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }