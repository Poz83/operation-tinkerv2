---
description: B.L.A.S.T. Protocol - deterministic automation using existing project architecture
---

# System Pilot Protocol for Operation Tinker

> [!IMPORTANT]
> This protocol adapts the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) methodology to work with the **existing** Operation Tinker architecture. You operate AS the System Pilot.

---

## 🟢 Protocol 0: Initialization (For New Features Only)

Before writing new features or automation, ensure alignment with existing architecture:

### 1. Check Existing Documentation
Review these **before** any planning:
- `init/agents.md` → Multi-Agent AI architecture (Orchestrator, Architect, Inspector, Fixer)
- `SRC_FILE_REFERENCE.md` → Component & service dependencies
- `docs/ROADMAP.md` → Planning context
- `docs/Gemini Rules.md` → AI behavioral constraints

### 2. Use Project Memory (Antigravity Brain)
- **Implementation Plan** → `brain/<conversation-id>/implementation_plan.md`
- **Task Tracking** → `brain/<conversation-id>/task.md`
- **Findings/Discoveries** → `brain/<conversation-id>/findings.md` (create as needed)

### 3. Constitutional Documents (Existing)
The project constitution is split across:
| Purpose | Location |
|---------|----------|
| **Data Schemas** | `src/types.ts` |
| **Behavioral Rules** | `docs/Gemini Rules.md`, `init/agents.md` |
| **Architectural Invariants** | `SRC_FILE_REFERENCE.md`, `docs/architecture/` |

---

## 🏗️ Phase 1: B - Blueprint (Vision & Logic)

### 1. Discovery Questions (Ask the User)
- **North Star:** What single outcome defines success?
- **Integrations:** Which services? (Supabase, Cloudflare, Gemini, R2, Resend)
- **Source of Truth:** Where does primary data live? (Supabase tables, localStorage, R2 storage)
- **Delivery Payload:** How/where should results land? (UI, PDF, database, email)
- **Behavioral Rules:** "Do Not" rules or tone constraints?

### 2. Data-First Rule
Define JSON schemas in `src/types.ts` or a dedicated type file. Coding begins only after payload shape is confirmed:
```typescript
// Example: New feature types go in src/types.ts
export interface FeaturePayload {
  input: InputShape;
  output: OutputShape;
}
```

### 3. Research Phase
- Check Supabase docs: `mcp_supabase-mcp-server_search_docs`
- Check Gemini docs: `docs/GEMINI_IMAGEN_REFERENCE.md`
- Search GitHub for patterns: `search_web` tool

---

## ⚡ Phase 2: L - Link (Connectivity)

### 1. Verify Existing Connections
The project uses these integrations:
| Service | Config Location | Verification |
|---------|-----------------|--------------|
| **Supabase** | `.env.local` (VITE_SUPABASE_*) | MCP tools or Supabase dashboard |
| **Gemini AI** | `.env.local` (VITE_GEMINI_API_KEY) | `src/server/ai/gemini-client.ts` |
| **Cloudflare R2** | `wrangler.toml`, `.env.local` | `functions/` workers |
| **Resend Email** | Supabase Edge Function secrets | `supabase/functions/` |

### 2. Handshake Tests
For new integrations, add minimal verification in `scripts/` or as a test in `functions/`:
```bash
# Existing scripts location
scripts/
├── fix-imports.js
├── test-generation.ts  # Can add connection tests here
```

---

## ⚙️ Phase 3: A - Architect (The 3-Layer Build)

This project already implements the A.N.T. pattern:

### Layer 1: Architecture (SOPs) → `docs/` & `init/`
- Technical SOPs in Markdown
- `docs/architecture/` for component-level documentation
- **Golden Rule:** Update docs BEFORE updating code

### Layer 2: Navigation (Decision Making) → `src/server/ai/Orchestrator.ts`
The **Orchestrator** IS your navigation layer:
- Routes between Architect → Inspector → Fixer
- Manages state via `AttemptHistory`
- Emits progress updates

### Layer 3: Tools (Execution) → `src/server/ai/` & `src/services/`
Deterministic logic split by responsibility:
| Tool | File | Purpose |
|------|------|---------|
| Architect | `gemini-client.ts` | Image generation |
| Inspector | `qaService.ts` | Quality analysis |
| Fixer | `repairs.ts` | Auto-remediation |

### Adding New Tools
```
src/
├── server/
│   └── ai/           ← AI-specific tools
└── services/         ← Business logic services
```

---

## ✨ Phase 4: S - Stylize (Refinement & UI)

### 1. Payload Formatting
- PDF generation: `src/utils/pdf-generator.ts`
- Email templates: `docs/EMAIL_TEMPLATES.md`
- KDP specifications: `docs/kdp-specifications.md`

### 2. UI/UX Standards
- Global styles: `src/styles.css`
- Component pattern: `src/components/`
- Follow existing dark mode, animations, and glassmorphism patterns

### 3. User Feedback Loop
Use `notify_user` tool to present stylized results before deployment.

---

## 🛰️ Phase 5: T - Trigger (Deployment)

### 1. Cloud Transfer
```bash
# Build production bundle
npm run build

# Deploy to Cloudflare Pages
# (Automatic via Git push to main branch)
```

### 2. Database Migrations
New migrations go in `docs/migrations/` and apply via:
```bash
# Use MCP Supabase tools
mcp_supabase-mcp-server_apply_migration
```

### 3. Documentation
- Update `RELEASE_NOTES.md` with changes
- Update `docs/ROADMAP.md` if features complete

---

## 🛠️ Operating Principles

### 1. Self-Annealing (Repair Loop)
Already implemented in `Orchestrator.ts`:
1. **Analyze:** Inspector reads image, returns failure codes
2. **Patch:** Fixer generates repair plan with prompt overrides
3. **Test:** Orchestrator re-runs with patched parameters
4. **Learn:** Update `docs/` if pattern emerges

### 2. Deliverables vs. Intermediates
| Type | Location | Example |
|------|----------|---------|
| **Intermediate** | Memory/temp variables | R2 presigned URLs, generation attempts |
| **Deliverable** | Supabase/R2/PDF | Saved projects, exported books |

### 3. File Structure Reference
```
c:\myjoe\
├── init/            # Agents manifest
├── docs/            # Architecture, migrations, specs
├── src/
│   ├── server/ai/   # Layer 3 Tools (AI)
│   ├── services/    # Layer 3 Tools (Business)
│   ├── components/  # UI Components
│   └── types.ts     # Data Schemas
├── functions/       # Cloudflare Workers (Edge)
├── supabase/        # Edge Functions & Types
└── scripts/         # Build/test utilities
```

---

## Quick Reference Commands

```bash
# Development
// turbo
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Deploy (Cloudflare)
npx wrangler pages deploy dist
```

---

> [!NOTE]
> This protocol layers on top of the existing multi-agent architecture. The Orchestrator, Architect, Inspector, and Fixer already implement the core A.N.T. pattern. Focus new automation on services and tools that plug into this system.
