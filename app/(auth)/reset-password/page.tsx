"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { resetPasswordWithToken } from "@/app/actions/auth/reset-password"
import { toast } from "sonner"
import Link from "next/link"
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const strengthScore = getPasswordStrength(password)

  if (!token || !email) {
    return (
      <div className="auth-root">
        <div className="auth-card max-w-md mx-auto !grid-cols-1">
          <div className="auth-form-side !p-8 text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              This password recovery link is missing or invalid. Please request a new link from the forgot password page.
            </p>
            <Link href="/forgot-password" className="auth-btn-gold">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await resetPasswordWithToken({
        email: email!,
        token: token!,
        password,
        confirmPassword,
      })

      setLoading(false)

      if (res.success) {
        setSuccess(true)
        toast.success(res.message)
      } else {
        toast.error(res.error || "Failed to reset password.")
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
                Password Reset
              </div>
            </div>

            {success ? (
              <div className="py-4">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-2">
                  Password Updated!
                </h2>
                <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                  Your password has been changed securely. You can now sign in to your Lumina Jewels account with your new credentials.
                </p>
                <Link href="/sign_in" className="auth-btn-gold">
                  Sign In Now <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-2">
                  Set New Password
                </h1>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Choose a strong password to protect your account and orders for <strong>{email}</strong>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6 text-left">
                  {/* New Password */}
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-medium text-gray-700 mb-1">
                      New Password (min. 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="auth-input pr-10"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password && (
                      <div className="auth-strength-bar">
                        <div className={`auth-strength-seg ${strengthScore >= 1 ? '!bg-amber-400' : ''}`}></div>
                        <div className={`auth-strength-seg ${strengthScore >= 2 ? '!bg-amber-500' : ''}`}></div>
                        <div className={`auth-strength-seg ${strengthScore >= 3 ? '!bg-amber-600' : ''}`}></div>
                        <div className={`auth-strength-seg ${strengthScore >= 4 ? '!bg-green-600' : ''}`}></div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-new-password" className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirm-new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn-gold"
                  >
                    {loading ? "Updating Password..." : "Update Password"}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-gray-100">
                  <Link href="/sign_in" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
                    Cancel & Return to Sign In
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-sm text-gray-500">Loading Lumina Password Recovery...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
