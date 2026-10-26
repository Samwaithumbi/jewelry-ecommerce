"use client"

import { useState } from "react"
import { requestPasswordReset } from "@/app/actions/auth/forgot-password"
import { toast } from "sonner"
import Link from "next/link"
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      const res = await requestPasswordReset(email)
      setLoading(false)

      if (res.success) {
        setSent(true)
        toast.success("Password reset instructions sent.")
      } else {
        toast.error(res.error || "Failed to request password reset.")
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err?.message || "An unexpected error occurred.")
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card max-w-lg mx-auto !grid-cols-1">
        <div className="auth-form-side !p-8 md:!p-12 text-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="font-serif text-lg tracking-widest font-semibold text-gray-900">
                LUMINA JEWELS
              </div>
              <div className="text-[11px] text-amber-700 tracking-wider uppercase mt-1">
                Account Recovery
              </div>
            </div>

            {sent ? (
              <div className="py-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Mail className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">
                  Check Your Inbox
                </h2>
                <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                  If an account exists for <strong className="text-gray-900">{email}</strong>, we have sent a secure link to reset your password. The link is valid for 1 hour.
                </p>
                <div className="space-y-3">
                  <Link href="/sign_in" className="auth-btn-gold">
                    Return to Sign In
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 transition block mx-auto"
                  >
                    Didn't receive an email? Try again
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Enter the email address registered with your Lumina Jewels account and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6 text-left">
                  <div>
                    <label htmlFor="recovery-email" className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="recovery-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your account email"
                      className="auth-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn-gold"
                  >
                    {loading ? "Sending link..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-gray-100">
                  <Link
                    href="/sign_in"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
