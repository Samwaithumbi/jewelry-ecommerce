"use client"

import { useEffect, useState, Suspense } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, KeyRound, Sparkles, AlertCircle } from "lucide-react"

function SignInContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authMode, setAuthMode] = useState<"password" | "magic-link">("password")
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const urlError = searchParams.get("error")

  useEffect(() => {
    if (session) {
      router.push(callbackUrl)
    }
  }, [session, router, callbackUrl])

  useEffect(() => {
    if (urlError) {
      if (urlError === "CredentialsSignin") {
        toast.error("Invalid email or password. Please try again.")
      } else if (urlError === "OAuthAccountNotLinked") {
        toast.error("This email is already associated with another login method. Please sign in with your email and password.")
      } else {
        toast.error(`Authentication error: ${urlError}`)
      }
    }
  }, [urlError])

  if (session) return null

  // Password Login Handler
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      setLoading(false)

      if (res?.error) {
        toast.error(res.error)
      } else if (res?.ok) {
        toast.success("Welcome back! Signing you in...")
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err?.message || "An unexpected error occurred during sign in.")
    }
  }

  // Magic Link Handler
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address.")
      return
    }

    setLoading(true)
    try {
      const res = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      })

      setLoading(false)
      if (res?.ok) {
        setMagicLinkSent(true)
        toast.success(`Magic link sent! Check your inbox at ${email}`)
      } else {
        toast.error(res?.error || "Failed to send magic link.")
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err?.message || "Failed to send magic link.")
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        {/* Left Panel */}
        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div>
              <div className="auth-panel-logo">LUMINA JEWELS</div>
              <div className="auth-panel-tagline">Exclusive Haute Joaillerie</div>
            </div>

            <div className="auth-quote">
              <div className="auth-quote-bar"></div>
              <p className="auth-quote-text">
                "Jewelry is like a biography. It tells the story of who you are, where you've been, and where you're going."
              </p>
              <span className="auth-quote-author">— Lumina Jewels Private Collection</span>
            </div>

            <ul className="auth-trust-list">
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">Secure Member Authentication</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">Synchronized Bag & Wishlist</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">VIP Concierge & Order Tracking</span>
              </li>
            </ul>

            <div className="auth-panel-rating">
              ★★★★★ Certified & Guaranteed Authenticity
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <h1 className="text-2xl font-serif font-semibold mb-1 text-gray-900">Welcome Back</h1>
            <p className="text-xs text-gray-500 mb-5">
              Sign in to access your orders, wishlist, and bespoke benefits
            </p>

            {/* Error Banner if URL error exists */}
            {urlError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {urlError === "CredentialsSignin"
                    ? "Invalid email or password. Please verify and try again."
                    : urlError === "OAuthAccountNotLinked"
                    ? "An account with this email already exists with password. Please sign in below."
                    : `Authentication notice: ${urlError}`}
                </span>
              </div>
            )}

            {/* Method Tabs */}
            <div className="flex border-b border-gray-200 mb-5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setAuthMode("password")}
                className={`flex-1 pb-2 text-center transition border-b-2 ${
                  authMode === "password"
                    ? "border-amber-600 text-gray-900 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Password Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("magic-link")}
                className={`flex-1 pb-2 text-center transition border-b-2 ${
                  authMode === "magic-link"
                    ? "border-amber-600 text-gray-900 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Email Magic Link
              </button>
            </div>

            {/* Password Sign-In Form */}
            {authMode === "password" ? (
              <form className="space-y-4 mb-5" onSubmit={handlePasswordLogin}>
                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="auth-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block text-xs font-medium text-gray-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-amber-700 hover:text-amber-800 transition font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="login-password"
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-btn-gold mt-2"
                >
                  {loading ? "Signing in..." : "Sign In to Account"}
                </button>
              </form>
            ) : (
              /* Magic Link Form */
              <div>
                {magicLinkSent ? (
                  <div className="mb-5 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 text-xs">
                    <h3 className="font-semibold mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      Magic Link Sent
                    </h3>
                    <p className="leading-relaxed">
                      We sent a secure instant sign-in link to <strong>{email}</strong>. Check your inbox to sign in with one click.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMagicLinkSent(false)}
                      className="mt-3 text-green-700 font-medium underline block"
                    >
                      Send again or use different email
                    </button>
                  </div>
                ) : (
                  <form className="space-y-4 mb-5" onSubmit={handleMagicLink}>
                    <div>
                      <label htmlFor="magic-email" className="block text-xs font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="magic-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="auth-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="auth-btn-gold mt-2"
                    >
                      {loading ? "Sending link..." : "Send Magic Link"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="auth-divider mb-5">
              <div className="auth-divider-line"></div>
              <span className="text-xs text-gray-400 px-2 uppercase tracking-wider">or continue with</span>
              <div className="auth-divider-line"></div>
            </div>

            {/* Social Buttons */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl })}
                className="auth-btn-social w-full flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-xs font-medium text-gray-700">Continue with Google</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{" "}
                <Link href="/sign_up" className="auth-link-btn font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-sm text-gray-500">Loading Lumina Jewels Sign In...</div>}>
      <SignInContent />
    </Suspense>
  )
}