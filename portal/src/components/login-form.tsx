"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/auth-actions";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Brand */}
      <div className="login-animate login-delay-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-5">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
      </div>

      <h1 className="login-animate login-delay-200 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
        <span className="font-light">Selamat Datang</span>
      </h1>
      <p className="login-animate login-delay-300 text-muted-foreground">
        Masuk ke AsyHub — SMPIT Asy-Syadzili
      </p>

      {/* Error alert */}
      {error && (
        <div className="login-animate login-delay-100 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </span>
          {error}
        </div>
      )}

      <form className="space-y-5" action={handleSubmit}>
        {/* Username */}
        <div className="login-animate login-delay-400">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Username
          </label>
          <div className="glass-input">
            <input
              name="username"
              type="text"
              placeholder="Masukkan username"
              autoComplete="username"
              disabled={isPending}
              required
              className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder-muted-foreground/60"
            />
          </div>
        </div>

        {/* Password */}
        <div className="login-animate login-delay-500">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Password
          </label>
          <div className="glass-input">
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                autoComplete="current-password"
                disabled={isPending}
                required
                className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              >
                {showPassword
                  ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="login-animate login-delay-700 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 font-medium text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memproses...
            </span>
          ) : "Masuk"}
        </button>
      </form>

      {/* Footer */}
      <p className="login-animate login-delay-800 text-center text-xs text-muted-foreground mt-2">
        SMPIT Asy-Syadzili &copy; {new Date().getFullYear()} &middot; AsyHub
      </p>
    </div>
  );
}
