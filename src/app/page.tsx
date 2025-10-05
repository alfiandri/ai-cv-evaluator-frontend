"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * ✨ Modern Blue Glass Login Page
 * Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
 *
 * Features:
 *  - Animated gradient background with glassmorphism card
 *  - Login form with glowing inputs & gradient button
 *  - Uses backend response to get access_token + tenant_id
 *  - Saves to localStorage and redirects to /evaluation
 *
 * Setup:
 *   1️⃣ Add .env.local with:
 *       NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
 *   2️⃣ npm run dev
 */

interface LoginResponse {
  access_token: string;
  token_type?: string;
  tenant_id: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) throw new Error(data?.error || res.statusText || "Request failed");
  return data as T;
}

export default function Page() {
  const router = useRouter();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const res = await fetchJSON<LoginResponse>(`${apiBase}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.access_token || !res.tenant_id) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("authToken", res.access_token);
      localStorage.setItem("tenantId", res.tenant_id);

      router.push("/evaluation");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400">
      {/* Animated gradient circles */}
      <div className="absolute w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-8 text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">CV & Project Evaluation Login</h1>
          <p className="text-sm text-blue-100 mt-2">CV and Project Report, compares them with a Job Vacancy and Study Case Brief</p>
        </motion.div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/30 bg-white/20 text-white placeholder-blue-100/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/30 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/30 bg-white/20 text-white placeholder-blue-100/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/30 transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-2 mt-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-200 text-center mt-3"
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6 text-xs text-blue-100/80"
        >
          <p>
            © {new Date().getFullYear()} Made with ❤️ by <span className="font-semibold">Alfiandri Putra Perdana, S.Kom., M.Kom.</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
