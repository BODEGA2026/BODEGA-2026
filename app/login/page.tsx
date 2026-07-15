"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Mail, Lock, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (authError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push(searchParams.get("next") || "/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-[1]">
      <form onSubmit={handleSubmit} className="glass-panel-strong w-full max-w-[380px] p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#2d3a4a" }}>
            <LayoutDashboard size={22} color="#fff" />
          </div>
          <h1 className="text-[17px] font-bold tracking-tight">
            Anthony Rivera <span style={{ color: "var(--accent)" }}>Godoy</span>
          </h1>
          <p className="text-[11.5px] mt-1" style={{ color: "var(--ink-muted)" }}>
            Sistema Facturación · Panel Admin
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Correo</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
              <input
                type="email"
                required
                className="input-field !pl-9"
                placeholder="admin@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
              <input
                type="password"
                required
                className="input-field !pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-[12.5px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--danger-light)", color: "#c0281f" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary justify-center mt-1" style={{ opacity: loading ? 0.7 : 1 }}>
            <LogIn size={15} /> {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
