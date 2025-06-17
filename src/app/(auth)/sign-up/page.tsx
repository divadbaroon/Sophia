import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { signup, login } from "../../(auth)/login/actions"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function Signup({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/")
  }

  const resolvedParams = await searchParams
  const message = resolvedParams.message as string | undefined

  return (
    <div className="min-h-screen bg-white">

      {/* Sign Up Section */}
      <section className="min-h-screen flex justify-center items-center px-6">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-black">Create Account</CardTitle>
              <CardDescription className="text-gray-500">
                Start your personalized learning journey today
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <form id="signup-form" className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="h-12 border-gray-200 focus:border-blue-600 focus:ring-blue-600 rounded-lg"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">Min. 6 characters</span>
                  </div>
                  <Input
                    minLength={6}
                    name="password"
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="h-12 border-gray-200 focus:border-blue-600 focus:ring-blue-600 rounded-lg"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    minLength={6}
                    name="confirmPassword"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="h-12 border-gray-200 focus:border-blue-600 focus:ring-blue-600 rounded-lg"
                    required
                  />
                </div>
                {message && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    {message}
                  </div>
                )}
                <Button
                  formAction={signup}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  Create Account
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  formAction={login}
                  form="signup-form"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign in
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer text */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              By creating an account, you agree to our{" "}
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
