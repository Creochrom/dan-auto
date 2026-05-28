import { invoicesRepository } from "@/lib/repositories/invoices.repository";
import { jobsRepository } from "@/lib/repositories/jobs.repository";
import type {
  CreateDraftInvoiceInput,
  Invoice,
  UpdateDraftInvoiceInput,
} from "@/lib/types/workshop-data";

function formatDraftTotal(invoice: Invoice): string {
  if (invoice.totalPence == null) return "Draft saved";
  return `Draft invoice · £${(invoice.totalPence / 100).toFixed(2)}`;
}

export const invoicesService = {
  findByJobId(jobId: string): Promise<Invoice | undefined> {
    return invoicesRepository.findByJobId(jobId);
  },

  createDraft(input: CreateDraftInvoiceInput): Promise<Invoice> {
    return invoicesRepository.createDraft(input);
  },

  updateDraft(jobId: string, patch: UpdateDraftInvoiceInput): Promise<Invoice | null> {
    return invoicesRepository.updateDraft(jobId, patch);
  },

  async upsertDraft(
    jobId: string,
    patch: UpdateDraftInvoiceInput,
    actor = "admin"
  ): Promise<Invoice> {
    const existing = await invoicesRepository.findByJobId(jobId);
    const invoice = existing
      ? await invoicesRepository.updateDraft(jobId, patch)
      : await invoicesRepository.createDraft({ jobId, currency: "GBP", ...patch });

    if (!invoice) {
      throw new Error("Invoice upsert failed");
    }

    await jobsRepository
      .addTimelineEvent({
        jobId,
        eventType: existing ? "invoice_draft_updated" : "invoice_draft_created",
        actor,
        note: formatDraftTotal(invoice),
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalPence: invoice.totalPence,
        },
      })
      .catch((err) => {
        console.error("[invoices.service] addTimelineEvent failed:", err);
      });

    return invoice;
  },
};
