import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/drizzle/src/db/schema"
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          await resend.emails.send({
            from: provider.from!,
            to: identifier,
            subject: "Sign in to Jewelry Store",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Jewelry Store</h2>
                <p style="color: #555; line-height: 1.5;">Click the link below to sign in to your account. This link will expire in 24 hours.</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Sign In</a>
                </div>
                <p style="color: #999; font-size: 12px;">If you did not request this email, you can safely ignore it.</p>
              </div>
            `,
          })
        } catch (error) {
          console.error("Failed to send verification email:", error)
          throw new Error("Failed to send verification email.")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          const cookieStore = await cookies()
          const guestSessionId = cookieStore.get("guest_session")?.value
          if (guestSessionId) {
            const { mergeCarts } = await import("@/app/actions/cart/merge-carts")
            await mergeCarts(guestSessionId, user.id)
            try {
              cookieStore.delete("guest_session")
            } catch {
              // Ignore if headers already sent
            }
          }
        } catch (error) {
          console.error("Error merging carts on sign-in", error)
        }
      }
      return true
    },

    /**
     * Populate the JWT token with the user's id and role.
     * `user` is only present on the initial sign-in; subsequent calls
     * carry the persisted token, so we skip the DB fetch then.
     */
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        } catch (err) {
          console.error("Failed to fetch user role for JWT:", err)
        }
      }
      return token
    },

    /**
     * Expose id and role on the client-facing session object.
     * Server-side code must read role from session.user.role (cast as any
     * until next-auth typings are extended in types/next-auth.d.ts).
     */
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub
        if (token.role) (session.user as any).role = token.role
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }