"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const L = {
    subtitle: isAr ? "نظام الإدارة" : "Management System",
    email: isAr ? "الإيميل" : "Email",
    password: isAr ? "كلمة السر" : "Password",
    signingIn: isAr ? "جاري تسجيل الدخول..." : "Signing in...",
    signIn: isAr ? "تسجيل الدخول" : "Sign In",
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-paws-orange rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">PAWS Egypt</h1>
          <p className="text-muted-foreground text-sm mt-1">{L.subtitle}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{L.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pawsegypt.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{L.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-paws-orange hover:bg-paws-orange/90 text-white"
            disabled={loading}
          >
            {loading ? L.signingIn : L.signIn}
          </Button>
        </form>
      </div>
    </div>
  );
}
