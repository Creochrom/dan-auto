"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { saveSession } from "@/lib/enterprise/auth";
import type { AuthUser } from "@/lib/enterprise/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const json = (await res.json()) as
        | { ok: true; data: Pick<AuthUser, "login" | "displayName" | "role"> }
        | { ok: false; error: string };

      if (!json.ok) {
        setError(res.status === 401 ? "Invalid credentials" : "Login failed — try again");
        setLoading(false);
        return;
      }

      // Preserve client-side session for display (dashboard name/role).
      // The httpOnly cookie set by the server is the actual security boundary.
      saveSession({ id: json.data.login, ...json.data });
      router.replace("/admin");
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="premium-panel w-full max-w-md rounded-3xl p-8"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
            <Lock className="h-5 w-5" />
          </span>
          <motion.div>
            <h1 className="text-xl font-semibold text-white">Workshop OS</h1>
            <p className="text-sm text-zinc-500">Dan Auto admin sign in</p>
          </motion.div>
        </div>
        <motion.div className="mt-8 space-y-4">
          <input
            required
            autoComplete="username"
            placeholder="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="input-premium w-full rounded-xl px-4 py-3 text-white"
          />
          <input
            required
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-premium w-full rounded-xl px-4 py-3 text-white"
          />
          {error && <p className="text-sm text-amber-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-glow flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold text-black disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>
        </motion.div>
        <Link href="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-cyan">
          ← Back to website
        </Link>
      </motion.form>
    </div>
  );
}
