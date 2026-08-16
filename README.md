# Phaysr

**An AI assistant that shows users where to click.**

Phaysr is a drop-in JavaScript widget for SaaS products. A user asks a question in plain
language ("How do I invite a team member?"), and instead of replying with a wall of text,
the widget looks at the page — screenshot plus live DOM — and highlights the exact element
to interact with, one step at a time, until the task is done.

```html
<script
  src="https://cdn.phaysr.com/widget.js"
  data-api-key="phs_live_..."
  data-site-name="Acme"
  data-color="#9C5959"
  data-backend-url="https://api.phaysr.com"
  defer
></script>
```

That single tag is the entire integration. No SDK, no framework bindings, no changes to the
host application's markup.

---

## Table of contents

- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [HTTP API](#http-api)
- [Widget configuration](#widget-configuration)
- [Building and shipping the widget](#building-and-shipping-the-widget)
- [Deployment](#deployment)
- [Security model](#security-model)
- [Known gaps](#known-gaps)

---

## How it works

```
┌──────────────────── Customer's website ────────────────────┐
│                                                            │
│   <script src="cdn.phaysr.com/widget.js" …>                │
│                    │                                       │
│         ┌──────────▼──────────┐                            │
│         │  Widget (Preact)    │  runs inside a Shadow DOM  │
│         │  • DOM snapshot     │  so host CSS can't leak in │
│         │  • html2canvas shot │                            │
│         │  • overlay/highlight│                            │
│         └──────────┬──────────┘                            │
└────────────────────┼───────────────────────────────────────┘
                     │  POST /chat  (SSE stream back)
          ┌──────────▼──────────┐
          │  Backend (Hono)     │──── Supabase (users, sessions, projects)
          │  • API-key + domain │──── Stripe (subscriptions)
          │    + trial checks   │──── Jina Search (site context retrieval)
          │  • prompt assembly  │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  Anthropic API      │  Haiku 4.5 executor + Opus advisor tool
          └─────────────────────┘
```

One turn, end to end:

1. **Capture.** The widget walks the DOM and collects up to 150 visible, interactive
   elements — tag, trimmed text, a stable CSS selector, ARIA label, role — plus the values
   the user has already typed into form fields. In parallel it captures a downscaled JPEG
   screenshot with `html2canvas`.
2. **Authorize.** The backend resolves `data-api-key` to a project row, checks the calling
   `Origin` against the project's allowed domain, and checks that the owner's subscription
   is `active` or still inside the 7-day trial. Failures return `401`, `403`, or `402`.
3. **Ground.** If the project has a `context_url`, the backend runs a domain-scoped search
   through Jina (`s.jina.ai`, 24h in-memory cache keyed by domain + question). If the
   project has pasted context longer than 600 characters, a small keyword-scoring retriever
   picks the two most relevant chunks. Both are merged into the system prompt as a *hint*,
   explicitly not as ground truth.
4. **Answer.** Claude Haiku 4.5 runs as the executor with an Opus **advisor tool**
   (`advisor_20260301`) available for one call per turn on hard questions. The system prompt
   constrains the model hard: one step per answer, max two sentences, no markdown, imperative
   voice, reply in the user's language, and only ever reference selectors that appeared in
   the DOM list.
5. **Structure.** Every response ends with two machine-readable lines the backend strips off
   before the text reaches the user:

   ```
   SELECTOR:<css-selector-or-none>
   CONTINUE:<yes|no|done>
   ```

   `yes` means more steps follow on this page, `no` means the user must navigate elsewhere
   first, `done` means the goal is reached (or the question was off-topic).
6. **Verify.** Selectors are cross-checked against the DOM snapshot that was actually sent —
   anything hallucinated is dropped before it reaches the browser. A second heuristic pass
   catches the case where the model says "you're all set" but still claims `CONTINUE:yes`,
   and flips it to `done`.
7. **Stream.** Results go back over SSE as discrete events — `context_info`, `advisor`,
   `text`, `highlight`, `can_continue`, `done`, `error` — so the widget can show an
   "advisor thinking" state, then the text, then the highlight, then the Continue button.
8. **Guide.** The widget draws the highlight overlay, shows a cursor spinner, and watches a
   page fingerprint (`URL | title | first h1`) so it detects navigation even on SPAs that
   never change the URL. Pressing **Continue** re-runs the loop with fresh page state, up to
   6 steps per goal.

## Repository layout

A pnpm workspace with four packages:

| Path         | What it is | Dev port |
|--------------|------------|----------|
| `widget/`    | The embeddable widget. Preact + TypeScript, built by Vite as a single IIFE `widget.js`. | — (watch build) |
| `backend/`   | Hono API on Node. Auth, projects, billing, and the streaming chat endpoint. | 3000 |
| `app/`       | Marketing landing page + customer dashboard. React 19, React Router, Vite. | 5173 |
| `demo-site/` | A fake SaaS app ("Acme") used as a live playground for the widget. React + Tailwind. | 5174 |

Notable files:

```
widget/src/
  index.ts              mounts a Shadow DOM host, reads config off the script tag
  config.ts             data-* attribute parsing + defaults
  core/dom-context.ts   DOM snapshot, selector generation, input-value capture
  core/screenshot.ts    html2canvas capture and downscale
  core/highlighter.ts   highlight overlay, guide output, scroll-into-view (largest file)
  core/sse-client.ts    typed async generator over the SSE stream
  core/cursor-spinner.ts
  ui/app.tsx            conversation state machine, continue loop, navigation detection

backend/src/
  index.ts              Hono app, CORS allowlist, 2 MB body limit on /chat
  db.ts                 Supabase client + row types
  auth.ts               bcrypt hashing, session cookies, requireAuth middleware
  routes/chat.ts        the core: context retrieval, prompt, streaming, selector validation
  routes/projects.ts    project CRUD + API-key generation
  routes/billing.ts     Stripe checkout, customer portal, webhook
  routes/auth.ts        signup / signin / signout / me

app/src/pages/
  Landing.tsx           marketing page
  SignUp.tsx SignIn.tsx
  Onboarding.tsx        first project creation
  Embed.tsx             embed snippet, project settings, paywall
```

## Tech stack

- **Runtime:** Node 20+, pnpm workspaces, TypeScript throughout (strict mode)
- **Widget:** Preact 10, html2canvas, Vite library build (IIFE, no runtime deps to load)
- **Backend:** Hono 4, `@hono/node-server`, SSE streaming
- **AI:** `@anthropic-ai/sdk` — `claude-haiku-4-5` executor, `claude-opus-4-6` advisor tool
- **Data:** Supabase (Postgres) — `users`, `sessions`, `projects`
- **Payments:** Stripe subscriptions + webhooks
- **Retrieval:** Jina Search (`s.jina.ai`) for domain-scoped grounding
- **Frontends:** React 19, React Router 7, Vite; Tailwind 4 in the demo site only

## Getting started

**Prerequisites:** Node 20+, pnpm 9+, a Supabase project, an Anthropic API key. Stripe keys
are only needed if you want to exercise billing.

```bash
git clone https://github.com/DrJonah26/Phaysr.git
cd Phaysr
pnpm install

cp backend/.env.example backend/.env
# fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY at minimum

pnpm build:widget   # emits demo-site/public/widget.js
pnpm dev            # backend + app + demo-site + widget watch build, in parallel
```

Then open:

- <http://localhost:5173> — landing page and dashboard
- <http://localhost:5174> — demo site with the widget mounted (uses the `demo_local` key)

`dev.sh` (macOS) and `dev.bat` (Windows) do the same thing in separate terminal windows, and
`dev.sh` additionally starts `stripe listen` forwarding to the local webhook endpoint.

Both Vite dev servers proxy `/api/*` to `http://localhost:3000`, so no CORS configuration is
needed locally.

### Individual packages

```bash
pnpm dev:backend            # tsx watch src/index.ts
pnpm dev:app                # vite, port 5173
pnpm dev:demo               # vite, port 5174
pnpm build:widget           # one-off widget bundle
pnpm build:widget:watch     # rebuild on change
```

## Environment variables

All backend configuration lives in `backend/.env` — see `backend/.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Powers `/chat`. Without it the route returns 500. |
| `SUPABASE_URL` | yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | yes | Supabase anon key. |
| `STRIPE_SECRET_KEY` | for billing | Checkout sessions and customer portal. |
| `STRIPE_PRICE_ID` | for billing | The subscription price to sell. |
| `STRIPE_WEBHOOK_SECRET` | for billing | Verifies webhook signatures. |
| `ALLOWED_ORIGINS` | production | Comma-separated CORS allowlist. `*` reflects any origin. |
| `APP_URL` | production | Dashboard base URL for Stripe redirects. |
| `PORT` | no | Defaults to `3000`. |
| `NODE_ENV` | no | `production` makes the session cookie `Secure`. |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | no | Reserved for TTS, not yet wired up. |

The frontends need no environment variables. In production, `app/vercel.json` rewrites
`/api/*` to `https://api.phaysr.com/*`.

## Database schema

Three tables in Supabase. Timestamps are epoch milliseconds (`bigint`).

**`users`**

| Column | Type | Notes |
|---|---|---|
| `id` | text (ULID) | primary key |
| `email` | text | unique, lowercased |
| `password_hash` | text | bcrypt, cost 10 |
| `created_at` | bigint | |
| `subscription_status` | text | `active` \| `trial` \| `inactive` |
| `trial_started_at` | bigint \| null | 7-day trial clock |
| `stripe_customer_id` | text \| null | set on first checkout |

**`sessions`**

| Column | Type | Notes |
|---|---|---|
| `token` | text | 32 random bytes, hex; primary key |
| `user_id` | text | → `users.id` |
| `expires_at` | bigint | 30 days from creation |

**`projects`**

| Column | Type | Notes |
|---|---|---|
| `id` | text (ULID) | primary key |
| `user_id` | text | → `users.id` |
| `api_key` | text | `phs_live_` + 16 random bytes, hex |
| `site_name` | text | injected into the system prompt |
| `color` | text | widget accent color |
| `context` | text \| null | pasted FAQ/docs, retrieved over when > 600 chars |
| `context_url` | text \| null | domain searched via Jina for grounding |
| `allowed_domain` | text \| null | host that may call `/chat` with this key |
| `allowed_paths` | text \| null | comma-separated path prefixes |
| `created_at` / `updated_at` | bigint | |

## HTTP API

Base URL: `http://localhost:3000` in development, `https://api.phaysr.com` in production.
Dashboard endpoints authenticate with the `phaysr_sid` HTTP-only cookie; `/chat`
authenticates with the project API key in the request body.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness probe. |
| `POST` | `/auth/signup` | — | Creates a user, starts the 7-day trial, sets the session cookie. |
| `POST` | `/auth/signin` | — | Verifies the password, sets the session cookie. |
| `POST` | `/auth/signout` | cookie | Destroys the session row and clears the cookie. |
| `GET` | `/auth/me` | cookie | Returns the current user, or `{ user: null }`. |
| `GET` | `/projects` | cookie | Lists the caller's projects. |
| `POST` | `/projects` | cookie | Creates a project and generates its API key. |
| `PATCH` | `/projects/:id` | cookie | Updates name, color, context, allowed domain/paths. |
| `POST` | `/billing/checkout` | cookie | Returns a Stripe Checkout URL. |
| `POST` | `/billing/portal` | cookie | Returns a Stripe customer-portal URL. |
| `POST` | `/billing/webhook` | signature | Handles `checkout.session.completed` and `customer.subscription.deleted`. |
| `POST` | `/chat` | API key | The main endpoint. Max body 2 MB. Responds with SSE. |
| `POST` | `/tts` | — | Returns `501` — not implemented. |

### `POST /chat`

Request body:

```jsonc
{
  "question": "How do I invite a team member?",
  "screenshot_base64": "data:image/jpeg;base64,…",
  "dom_snapshot": [
    { "tag": "button", "text": "Invite", "selector": "[data-testid=\"invite\"]",
      "ariaLabel": null, "role": "button" }
  ],
  "input_values": [
    { "selector": "#email", "value": "a@b.com", "placeholder": "Email", "type": "email" }
  ],
  "current_url": "https://acme.com/team",
  "page_title": "Team — Acme",
  "conversation_history": [{ "role": "user", "content": "…" }],
  "api_key": "phs_live_…"
}
```

`site_name`, `site_context`, and `context_url` may be present in the payload but are
**ignored** — the backend always uses the values stored on the project row.

Response is an SSE stream:

| Event | Payload | Meaning |
|---|---|---|
| `context_info` | `{ url, fetched, chars }` | Whether external grounding succeeded. |
| `advisor` | `{ status: "thinking" }` | The Opus advisor tool was invoked. |
| `text` | `{ delta }` | The user-visible answer, with control lines stripped. |
| `highlight` | `{ selector }` | A DOM-validated selector to highlight. One event per selector. |
| `can_continue` | `{ value: "yes" \| "no" \| "done" }` | Whether to show the Continue button. |
| `done` | `{}` | End of turn. |
| `error` | `{ message }` | `api_error`, or an auth/validation code. |

Error responses: `400 invalid_json` / `missing_question`, `401 invalid_api_key`,
`402 trial_expired`, `403 domain_not_allowed`, `500 missing_anthropic_api_key`.

## Widget configuration

Every option is a `data-*` attribute on the script tag.

| Attribute | Default | Description |
|---|---|---|
| `data-api-key` | `''` | Project API key. Required. |
| `data-site-name` | `this site` | Display name; the backend overrides this from the DB. |
| `data-color` | `#9C5959` | Accent color for the bubble and highlights. |
| `data-backend-url` | `http://localhost:3000` | API origin. |
| `data-context` | `''` | Inline extra context. |
| `data-context-url` | — | URL whose domain is searched for grounding. |
| `data-show-welcome` | `false` | Show the welcome bubble on first load. |
| `data-allowed-paths` | `''` | Comma-separated path prefixes; the widget does not mount elsewhere. |
| `data-widget="ai-buddy"` | — | Optional marker used to locate the script tag. |

The widget mounts into a `<div>` with `all: initial` and an open Shadow Root at
`z-index: 2147483647`, so host page styles cannot bleed into it and it cannot be covered.
It is idempotent — a second copy of the script is a no-op.

## Building and shipping the widget

```bash
pnpm build:widget
```

Vite emits a single minified IIFE to `demo-site/public/widget.js` (no code splitting, no
external runtime). That same file is what gets uploaded to the CDN:

1. Build.
2. Upload `demo-site/public/widget.js` to the Cloudflare R2 bucket served at
   `cdn.phaysr.com`.
3. Purge the CDN cache.

The checked-in `demo-site/public/widget.js` is the build output — the demo site's own build
does not rebuild the widget, so rebuild and commit it whenever `widget/src` changes.

## Deployment

| Component | Host | Domain |
|---|---|---|
| Backend | Railway (root directory `backend/`) | `api.phaysr.com` |
| Dashboard + landing | Vercel (root directory `app/`) | `phaysr.com`, `www.phaysr.com` |
| Demo site | Vercel (root directory `demo-site/`) | `demo.phaysr.com` |
| `widget.js` | Cloudflare R2 + CDN | `cdn.phaysr.com` |

Notes:

- Set every backend variable from the table above in Railway, including
  `ALLOWED_ORIGINS=https://phaysr.com,https://www.phaysr.com,https://demo.phaysr.com` and
  `NODE_ENV=production`.
- `app/vercel.json` is required in production: it rewrites `/api/*` to the backend and
  falls back to `index.html` for client-side routing. Without it every API call 404s.
- Stripe: create a subscription product, then add a webhook to
  `https://api.phaysr.com/billing/webhook` subscribed to `checkout.session.completed` and
  `customer.subscription.deleted`.

## Security model

- **Prompt injection.** `site_name` and `site_context` are never taken from the request
  body; they are read from the project row keyed by the API key. The demo key `demo_local`
  gets a fixed name and no context at all.
- **Selector validation.** Only selectors present in the DOM snapshot the client actually
  sent are forwarded to the browser, so a hallucinated selector cannot cause a click target
  to be highlighted.
- **Domain binding.** A project may pin `allowed_domain`; requests from any other `Origin`
  are rejected with `403`. `localhost` and `127.0.0.1` are exempt so local development
  works.
- **Sessions.** HTTP-only, `SameSite=Lax`, `Secure` in production, 30-day TTL, stored
  server-side so signout is a real revocation. Passwords are bcrypt-hashed at cost 10.
- **Payload limits.** `/chat` caps the body at 2 MB — enough for a 0.5×-scaled JPEG plus the
  DOM snapshot — and trims the snapshot to 150 elements with 80-character text.
- **Grounding is a hint.** Retrieved site context is labeled in the system prompt as a hint
  to be combined with the screenshot and DOM, not as authority.

## Known gaps

- `POST /tts` is a stub returning `501`. The ElevenLabs Flash integration was deferred past
  MVP; the widget degrades to text-only.
- Retrieval for pasted context is keyword scoring, not embeddings.
- The Jina search cache is per-process and in-memory, so it does not survive restarts and is
  not shared across instances.
- `backend/src/db.ts` uses the Supabase **anon** key. Row-level security policies must be
  configured in Supabase for the data model to be safe in production.
- There is no automated test suite yet.
