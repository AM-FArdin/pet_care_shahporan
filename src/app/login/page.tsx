"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your password.");
        setLoading(false);
        return;
      }

      // Hard refresh navigation so middleware and server components pick up session cookie
      window.location.href = redirectUrl;
    } catch {
      setError("Network or server connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-6 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#1a2f5e] to-[#1a7f7f] p-8 text-center text-white relative">
          <div className="inline-block p-1 bg-white/20 backdrop-blur-md rounded-2xl mb-4 shadow-md">
            <Image
              src="/logo.jpg"
              alt="Shahporan Pet & Vet Care"
              width={76}
              height={76}
              className="rounded-xl object-cover"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Shahporan Pet &amp; Vet Care</h1>
          <p className="text-teal-200 text-xs sm:text-sm font-medium mt-1">Sylhet, Bangladesh • Clinic Management Portal</p>
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-3">
            <ShieldCheck size={12} className="text-amber-300" />
            ADMIN SECURITY GATE
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-gray-900">Administrator Sign In</h2>
            <p className="text-xs text-gray-500">
              Enter your clinic admin credentials to access patient records, billing, and inventory.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username / Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Admin Password
                </label>
                <span className="text-[11px] text-gray-400 font-medium">Default: shahporan2026</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a7f7f] hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-60 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying Admin Session...
                </>
              ) : (
                <>
                  Enter Clinic Dashboard
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              🔒 Protected by Edge Security Token. Only authorized veterinarians and clinic staff may proceed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
