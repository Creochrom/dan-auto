import { getAnythingLlmConfig, isAnythingLlmConfigured } from "@/lib/copilot/config";

export type KnowledgeDocument = {
  id: string;
  name: string;
  createdAt?: string;
  sizeInBytes?: number;
};

type WorkspacePayload = {
  workspace?: {
    documents?: Array<Record<string, unknown>>;
  };
};

function normalizeDoc(raw: Record<string, unknown>, idx: number): KnowledgeDocument {
  const id =
    (typeof raw.id === "string" && raw.id) ||
    (typeof raw.docId === "string" && raw.docId) ||
    (typeof raw.uuid === "string" && raw.uuid) ||
    `doc_${idx}`;

  const name =
    (typeof raw.name === "string" && raw.name) ||
    (typeof raw.title === "string" && raw.title) ||
    (typeof raw.location === "string" && raw.location) ||
    "Untitled document";

  const createdAt =
    (typeof raw.createdAt === "string" && raw.createdAt) ||
    (typeof raw.created_at === "string" && raw.created_at) ||
    undefined;

  const sizeCandidate = raw.size ?? raw.sizeInBytes ?? raw.fileSize ?? raw.bytes;
  const sizeInBytes = typeof sizeCandidate === "number" ? sizeCandidate : undefined;

  return { id, name, createdAt, sizeInBytes };
}

export const anythingllmKnowledgeService = {
  async listDocuments(): Promise<KnowledgeDocument[]> {
    if (!isAnythingLlmConfigured()) return [];
    const config = getAnythingLlmConfig();
    const base = config.baseUrl.replace(/\/$/, "");

    const response = await fetch(`${base}/api/v1/workspace/${config.workspaceSlug}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`Workspace lookup failed (${response.status})`);
    }

    const body = (await response.json()) as WorkspacePayload;
    const docs = Array.isArray(body.workspace?.documents) ? body.workspace.documents : [];
    return docs.map((doc, i) => normalizeDoc(doc, i));
  },

  async uploadDocument(file: File): Promise<void> {
    if (!isAnythingLlmConfigured()) {
      throw new Error("AnythingLLM is not configured.");
    }
    const config = getAnythingLlmConfig();
    const base = config.baseUrl.replace(/\/$/, "");

    const form = new FormData();
    form.append("file", file, file.name);
    form.append("addToWorkspaces", config.workspaceSlug);

    const response = await fetch(`${base}/api/v1/document/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Upload failed (${response.status}): ${text.slice(0, 120)}`);
    }
  },
};
