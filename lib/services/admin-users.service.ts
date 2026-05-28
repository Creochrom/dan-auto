import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hashAdminPassword, verifyPasswordAgainstHash } from "@/lib/admin/credentials";
import type { AdminRole, AdminUser } from "@/lib/types/admin-user";

type AdminUserRow = {
  id: string;
  login: string;
  display_name: string;
  role: AdminRole;
  password_hash: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_password_change_at: string | null;
};

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    login: row.login,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastPasswordChangeAt: row.last_password_change_at ?? undefined,
  };
}

function newAdminUserId() {
  return `au_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const adminUsersService = {
  async list(): Promise<AdminUser[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`admin_users.list: ${error.message}`);
    return (data as AdminUserRow[]).map(toAdminUser);
  },

  async findById(id: string): Promise<AdminUser | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`admin_users.findById: ${error.message}`);
    return data ? toAdminUser(data as AdminUserRow) : null;
  },

  async findByLogin(login: string): Promise<AdminUser | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("login", login.trim().toLowerCase())
      .maybeSingle();
    if (error) throw new Error(`admin_users.findByLogin: ${error.message}`);
    return data ? toAdminUser(data as AdminUserRow) : null;
  },

  async authenticate(login: string, password: string): Promise<AdminUser | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("login", login.trim().toLowerCase())
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(`admin_users.authenticate: ${error.message}`);
    if (!data) return null;

    const row = data as AdminUserRow;
    const ok = verifyPasswordAgainstHash(password, row.password_hash);
    if (!ok) return null;
    return toAdminUser(row);
  },

  async create(input: {
    login: string;
    displayName: string;
    role: AdminRole;
    password: string;
  }): Promise<AdminUser> {
    const supabase = getSupabaseServerClient();
    const row: AdminUserRow = {
      id: newAdminUserId(),
      login: input.login.trim().toLowerCase(),
      display_name: input.displayName.trim(),
      role: input.role,
      password_hash: hashAdminPassword(input.password),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_password_change_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("admin_users")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`admin_users.create: ${error.message}`);
    return toAdminUser(data as AdminUserRow);
  },

  async updateProfile(
    id: string,
    patch: { displayName?: string; role?: AdminRole; active?: boolean }
  ): Promise<AdminUser | null> {
    const supabase = getSupabaseServerClient();
    const updates: Partial<AdminUserRow> = {};
    if (patch.displayName !== undefined) updates.display_name = patch.displayName.trim();
    if (patch.role !== undefined) updates.role = patch.role;
    if (patch.active !== undefined) updates.active = patch.active;
    if (Object.keys(updates).length === 0) return this.findById(id);

    const { data, error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`admin_users.updateProfile: ${error.message}`);
    return data ? toAdminUser(data as AdminUserRow) : null;
  },

  async resetPassword(id: string, newPassword: string): Promise<AdminUser | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .update({
        password_hash: hashAdminPassword(newPassword),
        last_password_change_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`admin_users.resetPassword: ${error.message}`);
    return data ? toAdminUser(data as AdminUserRow) : null;
  },
};

