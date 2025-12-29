"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Logo } from "@/components/shared/logo"
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null): string => {
    if (!errorCode) return "An error occurred"

    const errorMap: Record<string, string> = {
      "CredentialsSignin": "Invalid email or password. Please check your credentials and try again.",
      "ACCOUNT_NOT_FOUND": "No account found with this email address.",
      "INVALID_PASSWORD": "Incorrect password. Please try again.",
      "MISSING_CREDENTIALS": "Please enter both email and password.",
      "DATABASE_ERROR": "A database error occurred. Please try again later.",
      "Configuration": "Authentication is not properly configured. Please contact support.",
    }

    return errorMap[errorCode] || "Invalid email or password. Please check your credentials and try again."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Clear previous errors

    if (!formData.email.trim() || !formData.password.trim()) {
      const errorMsg = "Please enter both email and password"
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        const errorMessage = getErrorMessage(result.error)
        setError(errorMessage)
        toast.error("Sign In Failed", {
          description: errorMessage,
        })
      } else if (result?.ok) {
        toast.success("Signed in successfully")
        router.push("/")
        router.refresh()
      } else {
        // If no error but also not ok, show generic error
        const errorMessage = "Failed to sign in. Please check your credentials."
        setError(errorMessage)
        toast.error("Sign In Failed", {
          description: errorMessage,
        })
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      const errorMessage = error?.message || "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast.error("Error", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-slate-50/50 dark:via-slate-950/50 to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 backdrop-blur-sm bg-card/95 dark:bg-card/90">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
              <Logo variant="full" size="lg" />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to manage your ministry group
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setError(null) // Clear error when user types
                  }}
                  required
                  disabled={loading}
                  className={cn(
                    "pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setError(null) // Clear error when user types
                  }}
                  required
                  disabled={loading}
                  className={cn(
                    "pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 group"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
