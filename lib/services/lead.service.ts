import { leadsRepository } from "@/lib/repositories/leads.repository";
import { sendWorkshopLeadAlert } from "@/lib/email/send-lead-alert";
import { getEmailProvider } from "@/lib/email/config";
import { logLeadEvent } from "@/lib/logging/lead-events";
import type { IntakeIntent } from "@/lib/types/ai-intake";
import type { CreateLeadInput, Lead, LeadStatus } from "@/lib/types/lead";

export type LeadCreateOptions = {
  /** Skip when caller already sent a richer workshop intake email (e.g. AI intake submit). */
  suppressWorkshopEmail?: boolean;
  /** Refines source label in workshop email (callback / quote / book). */
  sourceIntent?: IntakeIntent;
};

export const leadService = {
  list(): Promise<Lead[]> {
    return leadsRepository.list();
  },

  /**
   * 1. Persist lead
   * 2. Notify workshop inbox (all BOOKING_EMAIL_TO recipients)
   * Email failures never roll back persistence.
   */
  async create(input: CreateLeadInput, opts?: LeadCreateOptions): Promise<Lead> {
    const lead = await leadsRepository.create(input);

    logLeadEvent("lead.created", {
      leadId: lead.id,
      source: lead.source,
      provider: getEmailProvider(),
      hasEmail: Boolean(lead.email),
      hasRegistration: Boolean(lead.registration),
    });

    if (opts?.suppressWorkshopEmail) {
      logLeadEvent("notification.skipped", {
        kind: "workshop_lead",
        leadId: lead.id,
        reason: "suppressWorkshopEmail",
      });
    } else {
      await sendWorkshopLeadAlert(lead, { sourceIntent: opts?.sourceIntent });
    }

    return lead;
  },

  updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return leadsRepository.updateStatus(id, status);
  },
};
