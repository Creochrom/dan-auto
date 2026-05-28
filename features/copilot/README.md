# Workshop copilot (internal)

Internal AI assistant for Dan Auto Centre staff — **not** the customer service advisor.

## Architecture

```
Admin UI (CopilotPanel)
  → features/copilot/services/copilot-client.ts
  → POST /api/copilot (admin session)
  → lib/services/copilot.service.ts
  → lib/copilot/providers/ (retrieveWorkshopKnowledge + askCopilot)
  → Gemini (today) / AnythingLLM (future RAG)
```

Customer advisor remains `POST /api/chat` + `lib/services/gemini.service.ts`.

## Prompt kinds

| Kind | Use |
|------|-----|
| `diagnostics` | Symptom → checks → job-card notes |
| `customer_explanation` | Plain-English draft for customer |
| `workshop_notes` | Internal job / CRM notes |

Prompts live in `features/copilot/prompts/`.

## Phase 1 — Knowledge Brain (next)

Retrieval stub today: `retrieveWorkshopKnowledge()` → `[]` until AnythingLLM is wired.

**Setup guide:** `docs/ANYTHINGLLM_SETUP.md`  
**Roadmap:** `project-brain/ROADMAP.md` → Workshop AI phased milestones

```env
ANYTHINGLLM_ENABLED=true
ANYTHINGLLM_BASE_URL=https://your-host
ANYTHINGLLM_API_KEY=
ANYTHINGLLM_WORKSPACE_SLUG=dan-auto-workshop
```

Implement retrieval in `lib/copilot/providers/anythingllm.provider.ts`.

## Mounting

`CopilotPanel` is mounted on `/admin` (`AdminDashboard`) as a floating panel.
