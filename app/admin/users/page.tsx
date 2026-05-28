"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import type { AdminRole } from "@/lib/enterprise/auth";
import type { AdminUser } from "@/lib/types/admin-user";

type UsersResponse =
  | { ok: true; data: AdminUser[] }
  | { ok: false; error: string };

const ROLES: AdminRole[] = ["owner", "admin", "mechanic"];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRole>("mechanic");
  const [password, setPassword] = useState("");
  const [resetByUserId, setResetByUserId] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/users", { credentials: "include" });
      if (res.status === 401) {
        router.replace("/admin/login?from=/admin/users");
        return;
      }
      if (res.status === 403) {
        setError("Only owner/admin can manage users.");
        setUsers([]);
        return;
      }
      const json = (await res.json()) as UsersResponse;
      if (!json.ok) throw new Error(json.error);
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async () => {
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, displayName, role, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Create failed");
      setMessage(`Created user ${login}`);
      setLogin("");
      setDisplayName("");
      setPassword("");
      setRole("mechanic");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }, [displayName, loadUsers, login, password, role]);

  const updateUser = useCallback(
    async (id: string, patch: Record<string, unknown>, successMsg: string) => {
      setError(null);
      setMessage(null);
      const res = await adminFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Update failed");
      setMessage(successMsg);
      await loadUsers();
    },
    [loadUsers]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users & Permissions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create admin/mechanic users and reset passwords.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
          ← Dashboard
        </Link>
      </div>

      <AdminQuickLinks active="workshop-assistant" />

      <section className="premium-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white">Create user</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Login (e.g. steve)"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="input-premium rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-premium rounded-xl px-3 py-2 text-sm text-white"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="input-premium rounded-xl px-3 py-2 text-sm text-white"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Temporary password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-premium rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => void createUser()}
          disabled={creating}
          className="mt-3 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-4 py-2 text-sm text-[#e8d5a3] hover:border-[#d4a63c]/55 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create user"}
        </button>
      </section>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}

      <section className="premium-card mt-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white">Team accounts</h2>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading users...</p>
        ) : (
          <div className="mt-3 space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-white/[0.08] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.displayName}</p>
                    <p className="text-xs text-zinc-500">@{user.login}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      defaultValue={user.role}
                      onChange={(e) =>
                        void updateUser(
                          user.id,
                          { role: e.target.value },
                          `Updated ${user.login} role`
                        ).catch((err) => setError(String(err)))
                      }
                      className="input-premium rounded-lg px-2 py-1 text-xs text-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        void updateUser(
                          user.id,
                          { active: !user.active },
                          `${user.active ? "Deactivated" : "Reactivated"} ${user.login}`
                        ).catch((err) => setError(String(err)))
                      }
                      className="rounded-lg border border-white/15 px-2 py-1 text-xs text-zinc-300 hover:border-white/30"
                    >
                      {user.active ? "Deactivate" : "Restore"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    placeholder="New password"
                    value={resetByUserId[user.id] ?? ""}
                    onChange={(e) =>
                      setResetByUserId((prev) => ({ ...prev, [user.id]: e.target.value }))
                    }
                    className="input-premium rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void updateUser(
                        user.id,
                        { resetPassword: resetByUserId[user.id] ?? "" },
                        `Password reset for ${user.login}`
                      )
                        .then(() =>
                          setResetByUserId((prev) => ({ ...prev, [user.id]: "" }))
                        )
                        .catch((err) => setError(String(err)))
                    }
                    className="rounded-lg border border-cyan/35 bg-cyan/10 px-3 py-2 text-xs text-cyan hover:border-cyan/55"
                  >
                    Reset password
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

