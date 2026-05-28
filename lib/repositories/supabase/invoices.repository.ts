import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateDraftInvoiceInput,
  Invoice,
  UpdateDraftInvoiceInput,
} from "@/lib/types/workshop-data";

type InvoiceRow = {
  id: string;
  job_id: string;
  invoice_number: string | null;
  status: "draft";
  currency: string;
  subtotal_pence: number | null;
  vat_pence: number | null;
  total_pence: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    jobId: row.job_id,
    invoiceNumber: row.invoice_number ?? undefined,
    status: row.status,
    currency: row.currency,
    subtotalPence: row.subtotal_pence ?? undefined,
    vatPence: row.vat_pence ?? undefined,
    totalPence: row.total_pence ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseInvoicesRepository = {
  async findByJobId(jobId: string): Promise<Invoice | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    if (error) throw new Error(`[invoices] findByJobId failed: ${error.message}`);
    if (!data) return undefined;
    return toInvoice(data as InvoiceRow);
  },

  async createDraft(input: CreateDraftInvoiceInput): Promise<Invoice> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      job_id: input.jobId,
      invoice_number: input.invoiceNumber ?? null,
      status: "draft" as const,
      currency: input.currency ?? "GBP",
      subtotal_pence: input.subtotalPence ?? null,
      vat_pence: input.vatPence ?? null,
      total_pence: input.totalPence ?? null,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("invoices")
      .upsert(row, { onConflict: "job_id" })
      .select("*")
      .single();
    if (error) throw new Error(`[invoices] createDraft failed: ${error.message}`);
    return toInvoice(data as InvoiceRow);
  },

  async listRecent(limit = 200): Promise<Invoice[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[invoices] listRecent failed: ${error.message}`);
    return (data ?? []).map((row) => toInvoice(row as InvoiceRow));
  },

  async updateDraft(jobId: string, patch: UpdateDraftInvoiceInput): Promise<Invoice | null> {
    const supabase = getSupabaseServerClient();
    const updates: Partial<InvoiceRow> = {};
    if (patch.invoiceNumber !== undefined) updates.invoice_number = patch.invoiceNumber;
    if (patch.subtotalPence !== undefined) updates.subtotal_pence = patch.subtotalPence;
    if (patch.vatPence !== undefined) updates.vat_pence = patch.vatPence;
    if (patch.totalPence !== undefined) updates.total_pence = patch.totalPence;
    if (patch.notes !== undefined) updates.notes = patch.notes;
    if (Object.keys(updates).length === 0) {
      return (await this.findByJobId(jobId)) ?? null;
    }
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("job_id", jobId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`[invoices] updateDraft failed: ${error.message}`);
    if (!data) return null;
    return toInvoice(data as InvoiceRow);
  },
};
