import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Pillai University SMS" }] }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
});

function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEmail = async (mode: "signin" | "signup", form: FormData) => {
    const parsed = credSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/students` },
        });
        if (error) throw error;
      }
      toast.success("Welcome!");
      router.navigate({ to: "/students" });
    } catch (e: any) {
      toast.error(e.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/students",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    router.navigate({ to: "/students" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 text-sidebar-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-md bg-accent flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold">Pillai University</div>
            <div className="text-sm text-sidebar-foreground/70">Student Management System</div>
          </div>
        </div>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight">Empowering academic excellence.</h1>
          <p className="mt-4 text-lg text-sidebar-foreground/80 max-w-md">
            A modern platform to manage student admissions, records and activity — designed for administrators.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} Pillai University</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Sign in to manage student records.</p>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEmail(mode, new FormData(e.currentTarget));
                  }}
                >
                  <div>
                    <Label htmlFor={`${mode}-email`}>Email</Label>
                    <Input id={`${mode}-email`} name="email" type="email" required autoComplete="email" />
                  </div>
                  <div>
                    <Label htmlFor={`${mode}-password`}>Password</Label>
                    <Input id={`${mode}-password`} name="password" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <span className="relative bg-background px-2 mx-auto block w-fit text-xs uppercase text-muted-foreground">Or continue with</span>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 1.49 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75Z"/></svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
