"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/shared/logo"
import { Mail, Lock, ArrowRight } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    if (!formData.password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("[SignIn] Attempting to sign in with email:", formData.email.trim())
      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      })

      console.log("[SignIn] Sign in result:", { error: result?.error, ok: result?.ok, url: result?.url })

      if (result?.error) {
        // Map known server error codes/messages to user-friendly toasts
        const code = result.error
        let errorTitle = "Login Failed"
        let errorDescription = "Unable to sign in. Please try again."

        switch (code) {
          case "ACCOUNT_NOT_FOUND":
            errorTitle = "Account Not Found"
            errorDescription = "No account found with this email. Please sign up first."
            break
          case "INVALID_PASSWORD":
            errorTitle = "Incorrect Password"
            errorDescription = "The password you entered is incorrect. Please try again."
            break
          case "MISSING_EMAIL_AND_PASSWORD":
            errorTitle = "Missing Information"
            errorDescription = "Please enter both email and password."
            break
          case "MISSING_EMAIL":
            errorTitle = "Email Required"
            errorDescription = "Please enter your email address."
            break
          case "MISSING_PASSWORD":
            errorTitle = "Password Required"
            errorDescription = "Please enter your password."
            break
          case "DATABASE_ERROR":
            errorTitle = "Connection Error"
            errorDescription = "Unable to connect to the database. Please try again later."
            break
          case "Configuration":
            errorTitle = "Configuration Error"
            errorDescription = "Authentication is not properly configured. Please check that AUTH_SECRET or NEXTAUTH_SECRET is set in your environment variables."
            break
          default:
            // Fallback to the message if NextAuth passes it through
            if (code && code !== "CredentialsSignin") {
              errorDescription = code
            }
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully",
        })

        // After signing in, check onboarding status to route appropriately
        try {
          const res = await fetch("/api/users/onboarding", { cache: "no-store" })
          if (res.ok) {
            const data = await res.json()
            if (!data.completed) {
              router.push("/onboarding")
              return
            }
          }
        } catch (err) {
          // If check fails, fall through to default home redirect
        }

        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-slate-50/50 dark:via-slate-950/50 to-primary/5 relative overflow-hidden">
      {/* Enhanced decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
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
              Enter your credentials to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end pt-1">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
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

