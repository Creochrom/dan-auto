# AnythingLLM Setup — Dan Auto Workshop Copilot

Internal knowledge base for the admin AI copilot. Staff can query manuals,
MOT procedures, service guides, and workshop SOPs; Gemini uses the retrieved
chunks as grounding context before generating answers.

---

## Architecture

```
Admin copilot query
  → POST /api/copilot (Next.js, admin session)
  → copilot.service.ts
  → retrieveWorkshopKnowledge()          ← AnythingLLM vector-search (this setup)
  → askCopilot() with knowledgeChunks[]
  → Gemini (generates answer referencing manual content)
  → CopilotAskResult { reply, sources[] }
```

AnythingLLM runs as a **local Docker container** — it does **not** need internet
access after the embedding model is downloaded. It is retrieval-only from the
Next.js side; no LLM tokens are spent inside AnythingLLM.

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Docker Desktop (or Docker Engine + Compose) | v24+ recommended |
| 4 GB free RAM | For the native embedding model |
| `ai/anythingllm/` directory in repo | `docker-compose.yml` and `storage/` volume |

---

## 2. Start the container

```bash
cd ai/anythingllm
docker compose up -d
```

AnythingLLM will be available at **http://localhost:3001**.

First startup takes ~2 minutes while it initialises the SQLite database and
downloads the default embedding model.

> **Tip:** Check logs with `docker compose logs -f anythingllm`

---

## 3. First-time configuration (UI)

Open **http://localhost:3001** in your browser.

### 3a. LLM provider
The copilot uses **Gemini** via Next.js — AnythingLLM only does retrieval here.
Select any cheap/fast provider for the AnythingLLM chat UI (not used by copilot).
Recommended: `Ollama` with `llama3.2:1b` or simply `OpenAI` with your key if
you want the in-browser chat to also work.

### 3b. Embedding model
Go to **Settings → Embedder**. The default **AnythingLLM Native** embedder works
offline. If you have an OpenAI key, `text-embedding-3-small` gives better quality.

### 3c. Vector database
Default **LanceDB** (local file-based) is fine. No extra setup needed.

---

## 4. Create the workspace

1. Click **New Workspace** in the sidebar.
2. Name it: **`Dan Auto Workshop`**
3. The slug will be auto-generated as **`dan-auto-workshop`** — confirm this
   matches `ANYTHINGLLM_WORKSPACE_SLUG` in your `.env.local`.

---

## 5. Generate an API key

**Settings → API Keys → Generate new API key**

Copy the key and set it in `.env.local`:

```env
ANYTHINGLLM_ENABLED=true
ANYTHINGLLM_BASE_URL=http://localhost:3001
ANYTHINGLLM_API_KEY=<paste key here>
ANYTHINGLLM_WORKSPACE_SLUG=dan-auto-workshop
```

Restart `npm run dev` after editing `.env.local`.

---

## 6. Pilot: one marque → one workflow → one golden query

**Rule:** Do not ingest the whole internet. Prove retrieval on **BMW** first, then VAG/Mercedes.

| Why BMW first | |
|---|---|
| Recurring faults (N47/N57, etc.) | High search volume in the workshop |
| Deep OEM / TSB material | Retrieval can shine |
| Profitable repairs | ROI on getting answers right |
| Mechanics constantly need specs | Torque, procedures, symptoms |

**Good sources:** OEM PDFs, workshop manuals, TSBs, UK MOT docs, torque sheets.  
**Bad sources:** Forum scrapes, outdated unlabeled PDFs, huge unchunked dumps.

Drag files into **Dan Auto Workshop** in the UI, or use the API (§7).

### Tier 1 — BMW pilot (load first)

| Document | Why |
|---|---|
| UK MOT inspection manual (DVSA Class 4/7) | Golden query: tyre sidewall fail criteria |
| BMW N47/N57 timing chain TSBs / bulletins | Golden query: timing chain symptoms |
| BMW injector replacement procedure + torque sheet | Golden query: injector torque sequence |
| BMW DPF regeneration overview (OEM or vetted guide) | Golden query: explain DPF to customer |

### Tier 2 — After golden queries pass

- More BMW models, service schedules, common fault summaries
- Haynes / Autodata exports for BMW only

### Tier 3 — Workshop-specific

- Dan Auto job-card SOP, pricing notes, customer comms templates

### File formats supported

PDF, DOCX, TXT, MD, CSV. Max 50 MB per file.

---

## 7. Ingest via API (bulk / automated)

Use this when you have many documents or want to script ingestion.

```bash
# Upload a document
curl -X POST http://localhost:3001/api/v1/document/upload \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -F "file=@/path/to/mot-inspection-manual.pdf" \
  -F "addToWorkspaces=dan-auto-workshop"

# Verify it was embedded
curl http://localhost:3001/api/v1/workspace/dan-auto-workshop \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  | jq '.workspace.documents | length'
```

---

## 8. Test retrieval (grounded = pass)

**Pass** = `sources[]` non-empty **and** answer cites uploaded doc content.  
**Fail** = fluent generic answer with empty sources (hallucination dressed as help).

### Golden queries (run all four after Tier 1 BMW + MOT ingest)

| Copilot mode | Query | Pass signal |
|---|---|---|
| **Diagnostics** | `Common N47 timing chain symptoms` | Symptoms match BMW/TSB material; sources name ingested files |
| **Procedures** | `Injector replacement torque sequence` | Torque steps/order from a doc — not invented Nm values |
| **Customer explanation** | `Explain DPF regeneration issue simply` | Plain English; consistent with uploaded DPF doc |
| **MOT** | `Tyre sidewall MOT fail criteria` | UK MOT rules (cuts, cords, bulges) from MOT manual |

When all four pass → **workshop brain is live** 🎉

### Via curl (vector search only)

```bash
curl -s -X POST http://localhost:3001/api/v1/workspace/dan-auto-workshop/vector-search \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"N47 timing chain symptoms","topN":3,"scoreThreshold":0.25}' \
  | jq '.vectorSearchResults | length'
```

Expected: `≥1` after BMW TSBs are embedded.

### Via admin copilot

1. Open `/admin` and sign in.
2. Copilot panel → run each golden query in the matching mode.
3. Network tab: `POST /api/copilot` → `data.sources` must not be `[]`.

---

## 9. Tuning

| Parameter | Location | Default | Notes |
|---|---|---|---|
| `topN` | `anythingllm.provider.ts` | `5` (from `query.limit`) | Increase for broader context; decrease to reduce token usage |
| `scoreThreshold` | `DEFAULT_SCORE_THRESHOLD` in provider | `0.25` | See embedder table below |
| Gemini `maxOutputTokens` | `gemini-copilot.provider.ts` | `2048` | Raise if answers are truncated with large context |

### `scoreThreshold` by embedder

The right threshold depends on which embedding model AnythingLLM is using
(**Settings → Embedder**). Cosine similarity ranges and noise floors differ:

| Embedder | Recommended threshold | Notes |
|---|---|---|
| AnythingLLM Native (default) | `0.20 – 0.30` | Lower similarity ceilings; start at `0.25` |
| OpenAI `text-embedding-3-small` | `0.35 – 0.50` | Tighter space; raise to `0.40` once quality verified |
| OpenAI `text-embedding-3-large` | `0.40 – 0.55` | Best quality; raise threshold to match |
| Ollama (local, e.g. `nomic-embed-text`) | `0.25 – 0.40` | Varies by model |

**Symptoms of wrong threshold:**

- `sourceThreshold` too **low** → irrelevant chunks appear in `sources[]`; Gemini confuses them.
- `sourceThreshold` too **high** → `sources[]` always empty even after Tier 1 docs are ingested.

**To tune live:** adjust `DEFAULT_SCORE_THRESHOLD` in
`lib/copilot/providers/anythingllm.provider.ts` and watch the health endpoint
`GET /api/health/anythingllm` + copilot `sources[]` until golden queries hit.

---

## 10. Production / Vercel (VPS + HTTPS — not localhost-only)

| Environment | `ANYTHINGLLM_BASE_URL` |
|---|---|
| Local dev | `http://localhost:3001` |
| **Production** | `https://llm.yourdomain.com` (VPS + Caddy/nginx + Let’s Encrypt) |

Vercel cannot call `localhost`. For live `danautocentre.co.uk` copilot RAG:

1. Run Docker on a **VPS** (always on, 4 GB+ RAM).
2. Put HTTPS in front (subdomain e.g. `llm.danautocentre.co.uk`).
3. Set `ANYTHINGLLM_BASE_URL` + `ANYTHINGLLM_API_KEY` on Vercel.
4. Smoke-test golden queries against **production** admin.

Avoid sleeping free tiers for production retrieval — cold starts = empty copilot.

> **Security:** The API key gives full read/write access to AnythingLLM.
> Never expose `ANYTHINGLLM_API_KEY` to the browser. All calls go through
> `POST /api/copilot` (admin session, server-side only).

---

## 11. Vercel env var checklist

All variables set under **Vercel → Project → Settings → Environment Variables**.

### Required for RAG copilot on Vercel

| Variable | Value | Notes |
|---|---|---|
| `ANYTHINGLLM_ENABLED` | `true` | Activates RAG path |
| `ANYTHINGLLM_BASE_URL` | `https://llm.danautocentre.co.uk` | Must be HTTPS; Vercel cannot reach `localhost` |
| `ANYTHINGLLM_API_KEY` | `<key from AnythingLLM UI>` | Settings → API Keys |
| `ANYTHINGLLM_WORKSPACE_SLUG` | `dan-auto-workshop` | Must match workspace slug exactly |

### Required for the broader app (co-dependent on copilot working)

| Variable | Notes |
|---|---|
| `GEMINI_API_KEY` | Copilot LLM; also customer advisor |
| `DVLA_API_KEY` | Homepage plate lookup — 503 if missing |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` | Admin session required to reach `/api/copilot` |
| `ADMIN_SESSION_SECRET` | Must be 32+ random bytes |

### Optional but recommended for production

| Variable | Notes |
|---|---|
| `MOT_HISTORY_API_KEY` | Richer MOT history in plate lookup |
| `RESEND_API_KEY` | Live email for booking alerts |
| `BOOKING_EMAIL_TO` | Workshop notification address |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `STORAGE_BACKEND=supabase` | Persistent DB |

> **Tip:** Run the smoke test below after each Vercel deploy to confirm RAG is live.

```bash
# Replace SESSION with your admin cookie value from browser DevTools.
curl -s "https://danautocentre.co.uk/api/health/anythingllm" \
  -H "Cookie: dan_admin_session=SESSION" | jq .
# Expected: { enabled: true, reachable: true, workspaceReady: true, documentCount: N }
```

---

## 12. After Phase 1 (product path, then Phase 2+)

| Layer | Value |
|---|---|
| Grounded retrieval | Answers from **your** manuals, not the open web |
| Workshop memory (Phase 2) | Plate + job history in copilot context |
| Structured job cards (Phase 3) | Notes stored on bookings |
| AI explanations | Customer drafts grounded in SOPs |

That stack is a credible **workshop knowledge** niche — not a generic chatbot.

**CrewAI / multi-agent:** later. Needs clean tools, retrieval, memory, workflows first — otherwise agents duplicate, argue, and hallucinate confidently.

---

## 13. Rollback / disable

Set `ANYTHINGLLM_ENABLED=false` (or remove the variable) and restart the server.
`retrieveWorkshopKnowledge()` returns `[]` immediately; the copilot continues
working via Gemini without RAG context.

No code changes needed.
