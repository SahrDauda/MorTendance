"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/shared/logo"
import { apiPost } from "@/lib/api-client"
import { Mail, Lock, User, ArrowRight } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("[SignUp] Attempting to register user:", formData.email)
      const registerResult = await apiPost("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      console.log("[SignUp] Registration result:", registerResult)

      toast({
        title: "Success",
        description: "Account created successfully!",
      })

      // Sign in the user automatically
      console.log("[SignUp] Attempting to sign in after registration")
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      console.log("[SignUp] Sign in result:", { error: signInResult?.error, ok: signInResult?.ok })

      if (signInResult?.error) {
        router.push("/auth/signin")
        return
      }

      // Check onboarding status to decide where to send the user
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
        // If the status check fails, fall through to the default redirect
      }

      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
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
              Join Bridge
            </CardTitle>
            <CardDescription className="text-base">
              Create an account to start your journey
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
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
                  minLength={8}
                  className="pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                  className="pl-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
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
                "Creating account..."
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href="/auth/signin" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

