"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { registerCustomer } from "@/app/actions/auth/register"
import { toast } from "sonner"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle2, Mail, Lock, User, ArrowRight } from "lucide-react"

export default function SignUp() {
  const { data: session } = useSession()
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      router.push("/")
    }
  }, [session, router])

  if (session) return null

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name.")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please provide a valid email address.")
      return
    }

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
      const res = await registerCustomer({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      })

      setLoading(false)

      if (res.success) {
        setRegisteredEmail(email)
        toast.success(res.message || "Account created successfully!")
      } else {
        toast.error(res.error || "Failed to create account.")
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err?.message || "An unexpected error occurred.")
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
              <div className="auth-panel-tagline">Timeless Elegance & Exclusive Craft</div>
            </div>

            <div className="auth-quote">
              <div className="auth-quote-bar"></div>
              <p className="auth-quote-text">
                "Every piece of jewelry tells a story. Begin your legacy of elegance with Lumina Jewels."
              </p>
              <span className="auth-quote-author">— Lumina Haute Joaillerie</span>
            </div>

            <ul className="auth-trust-list">
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">Exclusive 50 Welcome Loyalty Points</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">Priority Access to Limited Collections</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="auth-trust-icon">✓</div>
                <span className="text-sm text-gray-300">Bespoke Jewelry Concierge & Sizing</span>
              </li>
            </ul>

            <div className="auth-panel-rating">
              ★★★★★ Trusted by over 50,000 jewelry connoisseurs
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            {registeredEmail ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  We sent a confirmation link to <strong className="text-gray-900">{registeredEmail}</strong>. Please click the link inside to verify your account and activate your member privileges.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/sign_in"
                    className="auth-btn-gold"
                  >
                    Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setRegisteredEmail(null)}
                    className="text-xs text-gray-500 hover:text-gray-800 transition"
                  >
                    Need to change email or re-register?
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-serif font-semibold mb-2 text-gray-900">Create Account</h1>
                <p className="text-xs text-gray-500 mb-6">
                  Join Lumina Jewels to manage orders, wishlist, and exclusive tier benefits
                </p>

                {/* Sign Up Form */}
                <form className="mb-6 space-y-4" onSubmit={handleSubmit}>
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="first-name" className="block text-xs font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="first-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Sarah"
                        className="auth-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="last-name" className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="last-name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Johnson"
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="auth-input"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                      Password (min. 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
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
                    <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirm-password"
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
                    className="auth-btn-gold mt-2"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                {/* Divider */}
                <div className="auth-divider mb-6">
                  <div className="auth-divider-line"></div>
                  <span className="text-xs text-gray-400 px-2 uppercase tracking-wider">or continue with</span>
                  <div className="auth-divider-line"></div>
                </div>

                {/* Social Buttons */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
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

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Already have an account?{" "}
                    <Link href="/sign_in" className="auth-link-btn font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}