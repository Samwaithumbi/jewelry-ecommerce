"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmailToken } from "@/app/actions/auth/verify-email"
import { resendVerificationEmail } from "@/app/actions/auth/resend-verification"
import { toast } from "sonner"
import Link from "next/link"
import { CheckCircle2, XCircle, Mail, ArrowRight, Loader2, Sparkles } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendEmail, setResendEmail] = useState(email || "")
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function performVerification() {
      if (!token || !email) {
        setStatus("error")
        setErrorMessage("Verification link is missing or malformed.")
        return
      }

      try {
        const res = await verifyEmailToken({ email, token })
        if (!isMounted) return

        if (res.success) {
          setStatus("success")
          toast.success(res.message || "Email verified successfully!")
        } else {
          setStatus("error")
          setErrorMessage(res.error || "Verification failed.")
        }
      } catch (err: any) {
        if (!isMounted) return
        setStatus("error")
        setErrorMessage(err?.message || "An unexpected error occurred.")
      }
    }

    performVerification()

    return () => {
      isMounted = false
    }
  }, [token, email])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail || !resendEmail.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }

    setResending(true)
    try {
      const res = await resendVerificationEmail(resendEmail)
      setResending(false)

      if (res.success) {
        setResendSuccess(true)
        toast.success(res.message)
      } else {
        toast.error(res.error || "Failed to resend verification email.")
      }
    } catch (err: any) {
      setResending(false)
      toast.error(err?.message || "Failed to resend verification link.")
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card max-w-lg mx-auto !grid-cols-1">
        <div className="auth-form-side !p-8 md:!p-12 text-center">
          <div className="w-full max-w-md mx-auto">
            {/* Logo */}
            <div className="mb-6">
              <div className="font-serif text-lg tracking-widest font-semibold text-gray-900">
                LUMINA JEWELS
              </div>
              <div className="text-[11px] text-amber-700 tracking-wider uppercase mt-1">
                Security & Verification
              </div>
            </div>

            {/* Verifying State */}
            {status === "verifying" && (
              <div className="py-8">
                <Loader2 className="w-10 h-10 animate-spin text-amber-600 mx-auto mb-4" />
                <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">
                  Confirming Your Email
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Please wait while we verify your cryptographic token and activate your membership...
                </p>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="py-6">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Thank you for confirming your email address. Your Lumina Jewels account is fully active with full member privileges, loyalty rewards, and priority concierge access.
                </p>
                <div className="space-y-3">
                  <Link href="/sign_in" className="auth-btn-gold">
                    Sign In to Your Account <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link href="/" className="text-xs text-gray-500 hover:text-gray-800 block transition">
                    Explore the Collection
                  </Link>
                </div>
              </div>
            )}

            {/* Error / Resend State */}
            {status === "error" && (
              <div className="py-6">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <XCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">
                  Verification Link Expired
                </h2>
                <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                  {errorMessage || "This link is either invalid or expired. You can request a fresh verification link below."}
                </p>

                {resendSuccess ? (
                  <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 text-xs mb-6">
                    <Sparkles className="w-4 h-4 inline mr-1 text-green-600" />
                    A fresh verification link has been sent to <strong>{resendEmail}</strong>. Please check your inbox.
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-3 mb-6 text-left">
                    <div>
                      <label htmlFor="resend-email" className="block text-xs font-medium text-gray-700 mb-1">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        id="resend-email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="auth-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resending}
                      className="auth-btn-gold"
                    >
                      {resending ? "Sending New Link..." : "Send New Verification Link"}
                    </button>
                  </form>
                )}

                <div className="text-center pt-2 border-t border-gray-100">
                  <Link href="/sign_in" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
                    Return to Sign In
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-sm text-gray-500">Loading Lumina Verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
