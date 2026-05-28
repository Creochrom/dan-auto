import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseCustomersRepository } from "@/lib/repositories/supabase/customers.repository";
import type { Customer, UpsertCustomerInput } from "@/lib/types/workshop-data";

const mockCustomers = new Map<string, Customer>();

function customerId(name: string, phone: string) {
  const raw = `${phone.trim().toLowerCase()}|${name.trim().toLowerCase()}`
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9|]/g, "")
    .slice(0, 42);
  return `cus_${Buffer.from(raw).toString("base64url").slice(0, 22)}`;
}

export const customersRepository = {
  async findById(id: string): Promise<Customer | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseCustomersRepository.findById(id);
    }
    return mockCustomers.get(id);
  },

  async upsert(input: UpsertCustomerInput): Promise<Customer> {
    if (getStorageBackend() === "supabase") {
      return supabaseCustomersRepository.upsert(input);
    }
    const now = new Date().toISOString();
    const id = customerId(input.name, input.phone);
    const prev = mockCustomers.get(id);
    const customer: Customer = {
      id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email ?? prev?.email,
      notes: input.notes ?? prev?.notes,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };
    mockCustomers.set(id, customer);
    return customer;
  },
};
