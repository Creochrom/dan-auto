import { getEmailApiKey, getEmailFrom, getEmailProvider } from "@/lib/email/config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
};

export type SendEmailResult = {
  id: string;
  provider: "resend" | "log";
};

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = getEmailApiKey();
  if (!apiKey) {
    throw new Error("EMAIL_PROVIDER_API_KEY (or RESEND_API_KEY) is not configured");
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType,
      })),
    }),
  });

  const body = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `Resend API error (${res.status})`);
  }
  return { id: body.id ?? `resend_${Date.now()}`, provider: "resend" };
}

function sendViaLog(input: SendEmailInput): SendEmailResult {
  const to = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  console.info("[email:log] Transactional intake (dev — not sent via provider)", {
    to,
    subject: input.subject,
    textPreview: input.text.slice(0, 500),
  });
  return { id: `log_${Date.now()}`, provider: "log" };
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  if (provider === "log") return sendViaLog(input);
  return sendViaResend(input);
}
