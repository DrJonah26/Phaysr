# Launch Checklist

## Code-Fixes (Blocker)

### 1. Hardcoded localhost entfernen

In 5 Stellen `http://localhost:5173` durch `/` ersetzen:

- [ ] `app/src/pages/SignIn.tsx:35` — Logo-Link
- [ ] `app/src/pages/SignUp.tsx:37` — Logo-Link
- [ ] `app/src/pages/Onboarding.tsx:57` — Logo-Link
- [ ] `app/src/pages/Embed.tsx:101` — Logo-Link
- [ ] `app/src/pages/Embed.tsx:222` — Demo-Link

### 2. vercel.json für API-Proxy anlegen

`app/vercel.json` erstellen — ohne diesen Rewrite schlagen alle API-Calls in Production fehl
(Vite-Proxy läuft nur lokal, nicht auf Vercel):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.phaysr.com/:path*" }
  ]
}
```

### 3. Widget bauen

```bash
cd widget && pnpm build
# → schreibt demo-site/public/widget.js
# diese Datei dann auf Cloudflare R2 hochladen (s. Schritt CDN)
```

---

## Infrastruktur

### Hosting-Übersicht

| Teil | Hosting | Warum | Kosten |
|---|---|---|---|
| Backend | Railway | Node.js + persistentes Volume für SQLite. Cloudflare Workers geht nicht wegen `better-sqlite3` native bindings | ~$5/Mo |
| App (Landing + Dashboard) | Vercel | React + Vite, Auto-Deploy, Free Tier | kostenlos |
| Demo-Site | Vercel | gleicher Stack, separates Deployment | kostenlos |
| widget.js | Cloudflare R2 + CDN | Edge-CDN, URL `cdn.phaysr.com/widget.js` ist bereits im Code fest | kostenlos |

### Domains

| Domain | Ziel |
|---|---|
| `phaysr.com` | Vercel (App) |
| `www.phaysr.com` | Vercel (App) |
| `api.phaysr.com` | Railway (Backend) |
| `cdn.phaysr.com` | Cloudflare R2 (widget.js) |
| `demo.phaysr.com` | Vercel (Demo-Site) |

---

## Stripe einrichten

- [ ] Stripe Dashboard: Subscription-Produkt erstellen (z.B. $29/Mo)
- [ ] Webhook-Endpunkt anlegen: `https://api.phaysr.com/billing/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.deleted`
- [ ] Notieren: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

---

## Railway (Backend) deployen

- [ ] [railway.app](https://railway.app) → New Project → Deploy from GitHub
- [ ] Root Directory: `backend/`
- [ ] Persistent Volume anlegen, Mount Path: `/app/data` (SQLite liegt unter `data/phaysr.db`)
- [ ] Environment Variables setzen:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
ALLOWED_ORIGINS=https://phaysr.com,https://www.phaysr.com,https://demo.phaysr.com
APP_URL=https://phaysr.com
NODE_ENV=production
PORT=3000
```

- [ ] Custom Domain: `api.phaysr.com` → Railway-URL

| Variable | Woher |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ELEVENLABS_API_KEY` | elevenlabs.io Dashboard |
| `ELEVENLABS_VOICE_ID` | ElevenLabs → Voices → Voice ID |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_PRICE_ID` | Stripe → Produkt → Pricing → Price ID (beginnt mit `price_`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing Secret |

---

## Cloudflare R2 (widget.js CDN)

- [ ] Cloudflare Dashboard → R2 → Bucket `phaysr-cdn` anlegen
- [ ] `widget.js` aus `demo-site/public/widget.js` hochladen
- [ ] Custom Domain `cdn.phaysr.com` am Bucket aktivieren
- [ ] Bei Widget-Änderungen: `cd widget && pnpm build` → Datei erneut hochladen

---

## Vercel (App)

- [ ] Vercel → Import from GitHub, Root Directory: `app/`
- [ ] `app/vercel.json` muss committed sein (s. Code-Fix #2)
- [ ] Custom Domains: `phaysr.com`, `www.phaysr.com`

## Vercel (Demo-Site)

- [ ] Vercel → Import from GitHub, Root Directory: `demo-site/`
- [ ] Custom Domain: `demo.phaysr.com`
