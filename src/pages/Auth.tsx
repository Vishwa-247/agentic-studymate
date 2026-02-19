import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  CheckCircle,
  Chrome,
  Loader2,
  Mail,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const benefitsList = [
  "Agentic AI that adapts to your learning style",
  "Real-time mock interviews with instant feedback",
  "Personalized DSA practice paths",
  "Track your progress to FAANG readiness"
];

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [googleOAuthDisabled, setGoogleOAuthDisabled] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();

  // Detect OAuth redirect errors (e.g. disabled_client, access_denied)
  useEffect(() => {
    const error = searchParams.get("error") || window.location.hash.match(/error=([^&]*)/)?.[1];
    const errorDesc = searchParams.get("error_description") || window.location.hash.match(/error_description=([^&]*)/)?.[1];
    if (error) {
      const desc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, " ")) : "";
      const isDisabled = error === "disabled_client" || desc.includes("disabled");
      if (isDisabled) {
        setGoogleOAuthDisabled(true);
      }
      toast({
        title: "Google Sign-In Unavailable",
        description: isDisabled
          ? "Google sign-in is temporarily unavailable. Please use email/password to sign in."
          : `OAuth error: ${desc || error}`,
        variant: "destructive",
        duration: 8000,
      });
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const benefits = useMemo(
    () => ({
      primary: benefitsList.slice(0, 2),
      extra: benefitsList.slice(2),
    }),
    []
  );

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      navigate("/dashboard");
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const parsed = z.string().email().safeParse(forgotEmail);
    if (!parsed.success) {
      toast({
        title: "Enter a valid email",
        description: "Please enter the email you used to sign up.",
        variant: "destructive",
      });
      return;
    }

    try {
      setForgotSending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password reset sent",
        description: "Check your inbox for a reset link.",
      });
      setForgotOpen(false);
    } catch (e: any) {
      toast({
        title: "Could not send reset email",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotSending(false);
    }
  };

  const onSignupSubmit = async (data: SignupForm) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password, data.fullName);
      setActiveTab('login');
    } catch (error: any) {
      // If account already exists, switch to login tab and pre-fill email
      if (error?.message === "ACCOUNT_EXISTS") {
        loginForm.setValue("email", data.email);
        setActiveTab("login");
      }
      // Other errors are already handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="relative sm:sticky top-0 z-10 border-b border-border/10 bg-background/80 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src="/brand_logo.png"
              alt="Studymate"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Study<span className="text-primary">mate</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:py-24">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          {/* Left Column - Benefits */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                See Studymate<br />
                <span className="text-primary">in Action</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md">
                Get a personalized walkthrough of how our AI-powered learning platform can transform your career preparation.
              </p>
            </div>

            {/* Benefits list: collapsed on mobile, full on desktop */}
            <div className="space-y-4">
              <ul className="space-y-4 lg:hidden">
                {benefits.primary.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Collapsible open={benefitsOpen} onOpenChange={setBenefitsOpen} className="lg:hidden">
                <CollapsibleContent className="space-y-4">
                  <ul className="space-y-4 pt-4">
                    {benefits.extra.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-foreground/80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:text-foreground">
                    {benefitsOpen ? "Show less" : "Show more"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>

              <ul className="space-y-4 hidden lg:block">
                {benefitsList.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground/80">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="w-full max-w-md mx-auto lg:mx-0 order-1 lg:order-2">
            <Card className="border-border shadow-xl bg-card">
              <CardContent className="pt-6 px-6 pb-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/40 p-1">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="login"
                     className="space-y-4 focus-visible:outline-none"
                  >
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10 bg-background"
                            {...loginForm.register("email")}
                            disabled={isLoading}
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-xs text-destructive font-medium">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              setForgotEmail(loginForm.getValues("email") || "");
                              setForgotOpen(true);
                            }}
                          >
                            Forgot?
                          </button>
                        </div>
                        <PasswordInput
                          id="login-password"
                          placeholder="••••••••"
                          className="bg-background"
                          {...loginForm.register("password")}
                          disabled={isLoading}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-xs text-destructive font-medium">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full font-medium"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent
                    value="signup"
                     className="space-y-4 focus-visible:outline-none"
                  >
                    <form
                      onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            className="pl-10 bg-background"
                            {...signupForm.register("fullName")}
                            disabled={isLoading}
                          />
                        </div>
                        {signupForm.formState.errors.fullName && (
                          <p className="text-xs text-destructive font-medium">
                            {signupForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10 bg-background"
                            {...signupForm.register("email")}
                            disabled={isLoading}
                          />
                        </div>
                        {signupForm.formState.errors.email && (
                          <p className="text-xs text-destructive font-medium">
                            {signupForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <PasswordInput
                          id="signup-password"
                          placeholder="••••••••"
                          className="bg-background"
                          {...signupForm.register("password")}
                          disabled={isLoading}
                        />
                        {signupForm.formState.errors.password && (
                          <p className="text-xs text-destructive font-medium">
                            {signupForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <PasswordInput
                          id="signup-confirm"
                          placeholder="••••••••"
                          className="bg-background"
                          {...signupForm.register("confirmPassword")}
                          disabled={isLoading}
                        />
                        {signupForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive font-medium">
                            {signupForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full font-medium"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full bg-card"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || googleOAuthDisabled}
                    title={googleOAuthDisabled ? "Google sign-in is temporarily unavailable. The OAuth client needs to be re-enabled in Google Cloud Console." : undefined}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    {googleOAuthDisabled ? "Google Sign-In Unavailable" : "Continue with Google"}
                  </Button>
                  {googleOAuthDisabled && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Google OAuth is disabled. Please use email/password or contact the admin to re-enable the Google Cloud OAuth client.
                    </p>
                  )}
                </div>

                <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset your password</DialogTitle>
                      <DialogDescription>
                        Enter your email and we’ll send you a password reset link.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotSending}
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForgotOpen(false)}
                        disabled={forgotSending}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleForgotPassword} disabled={forgotSending}>
                        {forgotSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send reset link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}