"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { enrollInClass } from "@/lib/actions/class-actions"
import { UserIcon, Mail, Users, ArrowRight, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  classCode: string
  initialMessage?: string
}

export default function InvitationLogin({ classCode, initialMessage }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState(initialMessage || "")
  const [className, setClassName] = useState(classCode)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(true)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  async function handleAuth(formData: FormData, isSignup: boolean) {
    setIsLoading(true)
    setMessage("")
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm?classCode=${classCode}`
          }
        })

        if (error) {
          setMessage(error.message)
          return
        }

        if (data.user && !data.user.email_confirmed_at) {
          // User created but needs email verification
          setUserEmail(email)
          setShowVerificationModal(true)
          return
        }

        // If user is already verified (shouldn't happen on signup)
        if (data.user && data.user.email_confirmed_at) {
          const result = await enrollInClass(classCode)
          if (result.success) {
            if (result.classData?.name) {
              setClassName(result.classData.name)
            }
            router.push("/concepts")
          } else {
            setMessage(result.error || "Failed to enroll in class")
          }
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
          return
        }

        // After successful login, enroll in class
        const result = await enrollInClass(classCode)
        if (result.success) {
          if (result.classData?.name) {
            setClassName(result.classData.name)
          }
          router.push("/concepts")
        } else {
          setMessage(result.error || "Failed to enroll in class")
        }
      }
    } catch (error: any) {
      setMessage(error.message || (isSignup ? "Error signing up" : "Could not authenticate user"))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGuestSignIn() {
    setIsLoading(true)
    setMessage("")
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInAnonymously()

      if (error) {
        setMessage(error.message || "Could not sign in as guest")
        return
      }

      const result = await enrollInClass(classCode)
      if (result.success) {
        if (result.classData?.name) {
          setClassName(result.classData.name)
        }
        router.push("/concepts")
      } else {
        setMessage(result.error || "Failed to enroll in class")
      }
    } catch (error: any) {
      setMessage(error.message || "Could not sign in as guest")
    } finally {
      setIsLoading(false)
    }
  }

  async function resendVerificationEmail() {
    if (!userEmail) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm?classCode=${classCode}`
        }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Verification email sent!")
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to resend email")
    }
  }

  if (showVerificationModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-300/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>

        {/* Verification Modal */}
        <section className="min-h-screen flex justify-center items-center px-6 relative z-10">
          <div className="w-full max-w-lg">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 rounded-xl blur opacity-20"></div>
              <div className="absolute inset-[1px] bg-white/90 backdrop-blur-xl rounded-xl"></div>

              <CardContent className="relative flex flex-col gap-8 p-8 text-center">
                {/* Class info header */}
                <div>
                  <div className="mb-4">
                    <div className="relative inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {className}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification content */}
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      We&apos;ve sent a verification link to:
                    </p>
                    <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                      {userEmail}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click the link in the email to verify your account and automatically join <strong>{className}</strong>.
                    </p>
                  </div>
                </div>

                {message && (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-green-500/20 rounded-xl blur"></div>
                    <div className="relative text-sm font-medium text-green-700 bg-green-50/90 p-4 rounded-xl border border-green-200 backdrop-blur-sm">
                      {message}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Button
                    onClick={resendVerificationEmail}
                    variant="outline"
                    className="w-full h-12 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                  >
                    Resend Verification Email
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowVerificationModal(false)
                      setMessage("")
                    }}
                    variant="ghost"
                    className="w-full h-12 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign Up
                  </Button>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50/50 p-3 rounded-lg">
                  <p>Didn&apos;t receive the email? Check your spam folder or try resending.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <style jsx>{`
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 1s ease-out;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-300/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-200/10 to-blue-300/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-300/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>

      {/* Main Content */}
      <section className="min-h-screen flex justify-center items-center px-6 relative z-10">
        <div className="w-full max-w-lg mt-6">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden animate-slide-up mt-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 rounded-xl blur opacity-20"></div>
            <div className="absolute inset-[1px] bg-white/90 backdrop-blur-xl rounded-xl"></div>

            <CardContent className="relative flex flex-col gap-8 p-8">
              {/* Class Invitation Header */}
              <div className="text-center">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 font-medium">You&apos;ve been invited to join</p>
                  <div className="relative group">
                    <div className="relative inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xl rounded-xl shadow-lg">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {className}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm">
                  <span>Sign in or continue as guest to access your lessons</span>
                </div>
              </div>

              <form 
                id="auth-form" 
                className="grid gap-6" 
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleAuth(formData, isSigningUp)
                }}
              >
                <div className="space-y-6">
                  <div className="group">
                    <Label htmlFor="email" className="text-gray-700 font-semibold text-sm mb-2 block">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-14 border-2 border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 rounded-xl bg-white/70 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-sm mb-2 block">
                      Password
                    </Label>
                    <Input
                      minLength={6}
                      name="password"
                      id="password"
                      type="password"
                      placeholder={isSigningUp ? "Create your password (min. 6 characters)" : "Enter your password"}
                      className="h-14 border-2 border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 rounded-xl bg-white/70 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {message && (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-red-500/20 rounded-xl blur"></div>
                    <div className="relative text-sm font-medium text-red-700 bg-red-50/90 p-4 rounded-xl border border-red-200 backdrop-blur-sm">
                      {message}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isSigningUp ? "Creating Account..." : "Signing In..."}
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        {isSigningUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/90 px-6 text-gray-500 font-semibold tracking-wider">
                    {isSigningUp ? "Already have an account?" : "Don't have an account?"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSigningUp(!isSigningUp)
                  setMessage("")
                }}
                disabled={isLoading}
                className="group w-full h-12 text-blue-600 hover:text-blue-700 font-semibold transition-all duration-200 hover:bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 bg-blue-50/50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSigningUp ? "Sign In Instead" : "Create Account Instead"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </CardContent>
          </Card>

          {/* Guest Option */}
          <div className="mt-8 animate-fade-in-delay">
            <Button
              onClick={handleGuestSignIn}
              disabled={isLoading}
              variant="outline"
              className="group w-full h-14 border-2 border-gray-300 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white/80 hover:bg-blue-50/80 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-3">
                <UserIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Continue as Guest
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-10 animate-fade-in-delay-2">
            <p className="text-sm text-gray-500 leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.3s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.6s both;
        }
      `}</style>
    </div>
  )
}