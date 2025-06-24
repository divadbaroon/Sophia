'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { login, signup, signInAsGuest } from "@/app/(auth)/login/actions"
import { enrollInClass } from "@/lib/actions/class-actions" 
import { UserIcon, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  classCode: string
  initialMessage?: string
}

export default function InvitationLogin({ classCode, initialMessage }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState(initialMessage || '')
  const [className, setClassName] = useState(classCode)

  async function handleLogin(formData: FormData) {
    try {
      await login(formData)
      
      // Use your existing enrollInClass action
      const result = await enrollInClass(classCode)
      
      if (result.success) {
        // Update the class name if we got it from enrollment
        if (result.classData?.name) {
          setClassName(result.classData.name)
        }
        router.push('/lessons')
      } else {
        setMessage(result.error || 'Failed to enroll in class')
      }
    } catch (error: any) {
      setMessage(error.message || 'Could not authenticate user')
    }
  }

  async function handleSignup(formData: FormData) {
    try {
      await signup(formData)
      
      // Use your existing enrollInClass action
      const result = await enrollInClass(classCode)
      
      if (result.success) {
        // Update the class name if we got it from enrollment
        if (result.classData?.name) {
          setClassName(result.classData.name)
        }
        router.push('/lessons')
      } else {
        setMessage(result.error || 'Failed to enroll in class')
      }
    } catch (error: any) {
      setMessage(error.message || 'Error signing up')
    }
  }

  async function handleGuestSignIn() {
    try {
      await signInAsGuest()
      
      // Use your existing enrollInClass action
      const result = await enrollInClass(classCode)
      
      if (result.success) {
        // Update the class name if we got it from enrollment
        if (result.classData?.name) {
          setClassName(result.classData.name)
        }
        router.push('/lessons')
      } else {
        setMessage(result.error || 'Failed to enroll in class')
      }
    } catch (error: any) {
      setMessage(error.message || 'Could not sign in as guest')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Login Section */}
      <section className="min-h-screen flex justify-center items-center px-6 relative">
        <div className="w-full max-w-lg mt-16">
          <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="flex flex-col gap-6 pt-8 pb-8">
              {/* Class Invitation Header */}
              <div className="text-center mb-2">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    You&apos;ve been invited to join:
                  </p>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg shadow-md">
                    {className}
                  </div>
                </div>
                <p className="text-xs text-blue-600 font-medium mb-4">
                  Sign in or continue as guest to access your lessons
                </p>
              </div>

              <form id="login-form" className="grid gap-6" action={handleSignup}>
                {/* Create Account Section First */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    minLength={6}
                    name="password"
                    id="password"
                    type="password"
                    placeholder="Create your password"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>
                {message && (
                  <div className="text-sm font-medium text-red-600 bg-red-50/80 p-3 rounded-lg border border-red-200 backdrop-blur-sm">
                    {message}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Create Account & Join Class
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 px-4 text-gray-500 font-medium">Already have an account?</span>
                </div>
              </div>

              {/* Sign In Section */}
              <div className="text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    const form = document.getElementById('login-form') as HTMLFormElement
                    const formData = new FormData(form)
                    handleLogin(formData)
                  }}
                  className="w-full h-12 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline bg-blue-50/50 hover:bg-blue-100/50 rounded-lg border border-blue-200/50"
                >
                  Sign In to Class
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Guest option at bottom */}
          <div className="mt-6">
            <Button
              onClick={handleGuestSignIn}
              variant="outline"
              className="w-full h-12 border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-blue-50/80 hover:bg-blue-100/80 backdrop-blur-sm"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Continue as Guest
            </Button>
          </div>

          {/* Footer text */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}