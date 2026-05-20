import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/drizzle/src/db/schema"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const handler = NextAuth({
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
})

export { handler as GET, handler as POST }