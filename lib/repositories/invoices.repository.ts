import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseInvoicesRepository } from "@/lib/repositories/supabase/invoices.repository";
import type {
  CreateDraftInvoiceInput,
  Invoice,
  UpdateDraftInvoiceInput,
} from "@/lib/types/workshop-data";

const mockInvoices = new Map<string, Invoice>();

function newId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const invoicesRepository = {
  async findByJobId(jobId: string): Promise<Invoice | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseInvoicesRepository.findByJobId(jobId);
    }
    return mockInvoices.get(jobId);
  },

  async createDraft(input: CreateDraftInvoiceInput): Promise<Invoice> {
    if (getStorageBackend() === "supabase") {
      return supabaseInvoicesRepository.createDraft(input);
    }
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: newId(),
      jobId: input.jobId,
      invoiceNumber: input.invoiceNumber,
      status: "draft",
      currency: input.currency ?? "GBP",
      subtotalPence: input.subtotalPence,
      vatPence: input.vatPence,
      totalPence: input.totalPence,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    mockInvoices.set(input.jobId, invoice);
    return invoice;
  },

  async listRecent(limit = 200): Promise<Invoice[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseInvoicesRepository.listRecent(limit);
    }
    return [...mockInvoices.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  },

  async updateDraft(jobId: string, patch: UpdateDraftInvoiceInput): Promise<Invoice | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseInvoicesRepository.updateDraft(jobId, patch);
    }
    const current = mockInvoices.get(jobId);
    if (!current) return null;
    const updated: Invoice = {
      ...current,
      ...(patch.invoiceNumber !== undefined ? { invoiceNumber: patch.invoiceNumber } : {}),
      ...(patch.subtotalPence !== undefined ? { subtotalPence: patch.subtotalPence } : {}),
      ...(patch.vatPence !== undefined ? { vatPence: patch.vatPence } : {}),
      ...(patch.totalPence !== undefined ? { totalPence: patch.totalPence } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date().toISOString(),
    };
    mockInvoices.set(jobId, updated);
    return updated;
  },
};
