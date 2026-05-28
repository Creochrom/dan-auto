import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Customer, UpsertCustomerInput } from "@/lib/types/workshop-data";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function customerId(name: string, phone: string) {
  const raw = `${phone.trim().toLowerCase()}|${name.trim().toLowerCase()}`
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9|]/g, "")
    .slice(0, 42);
  return `cus_${Buffer.from(raw).toString("base64url").slice(0, 22)}`;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseCustomersRepository = {
  async findById(id: string): Promise<Customer | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`[customers] findById failed: ${error.message}`);
    if (!data) return undefined;
    return toCustomer(data as CustomerRow);
  },

  async upsert(input: UpsertCustomerInput): Promise<Customer> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: customerId(input.name, input.phone),
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email ?? null,
      notes: input.notes ?? null,
    };
    const { data, error } = await supabase
      .from("customers")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(`[customers] upsert failed: ${error.message}`);
    return toCustomer(data as CustomerRow);
  },
};
