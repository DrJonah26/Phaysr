# B2B Web Widget — CLAUDE.md

AI-Buddy als Script-Tag für SaaS-Produkte. SaaS-Firmen binden einen Script-Tag ein,
ihre Nutzer bekommen einen AI-Assistenten der die aktuelle Seite "sieht", Fragen beantwortet,
und UI-Elemente direkt highlightet — wie Clicky, aber im Browser, für jede Website.

Zielgruppe (MVP): Selbst testen + Demo für potenzielle Kunden.

---

## Stack

| Layer | Tech | Warum |
|---|---|---|
| Widget (injected) | Vanilla JS + Shadow DOM | Kein Framework-Konflikt mit Host-Website |
| Widget UI | Preact (3kb) | Klein genug für Script-Tag, komponentenbasiert |
| Screenshot | html2canvas | Browser-Screenshot ohne native APIs, keine Permissions nötig |
| Backend | Hono + Node.js | Bekannter Stack |
| AI | Claude Haiku 4.5 + Opus Advisor | Günstig + intelligent bei komplexen Fragen |
| TTS | ElevenLabs Flash API | Niedrige Latenz |
| Hosting | Cloudflare Workers (Backend) + Cloudflare CDN (Widget-Script) | Edge, schnell, günstig |
| Dashboard | React + Vite + Tailwind | Für SaaS-Kunden: API-Key, Customization |
| Demo-Site | React + Vite + Tailwind | Fake-SaaS zum Testen und als Marketing-Demo |

---

## Projektstruktur

```
web-widget/
├── widget/                    # Das eigentliche Widget (wird als Script-Tag eingebunden)
│   ├── src/
│   │   ├── index.ts           # Entry Point, initialisiert Widget
│   │   ├── core/
│   │   │   ├── dom-context.ts # DOM-Snapshot Logik
│   │   │   ├── screenshot.ts  # html2canvas Screenshot + Base64
│   │   │   ├── highlighter.ts # Element-Highlighting via CSS Selector
│   │   │   └── tts.ts         # ElevenLabs TTS Client
│   │   └── ui/
│   │       ├── bubble.tsx     # Floating Button (minimiert)
│   │       ├── chat.tsx       # Chat-Panel (aufgeklappt)
│   │       └── highlight-ring.tsx  # Animierter Ring um Elemente
│   └── package.json           # Output: widget.js (< 50kb gzipped)
│
├── backend/                   # Hono API
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       ├── chat.ts        # Claude API mit Advisor
│   │       └── tts.ts         # ElevenLabs Proxy
│   └── package.json
│
├── dashboard/                 # SaaS-Kunden Dashboard (Phase 2)
│   └── ...
│
└── demo-site/                 # Fake-SaaS zum Testen
    ├── src/
    │   ├── App.tsx            # Fake Projektmanagement-Tool UI
    │   └── main.tsx           # Bindet widget.js ein
    └── package.json
```

---

## Kern-Feature: DOM + Screenshot Kombination (maximale Leistung)

### Warum Kombination?

| | Nur DOM | Nur Screenshot | DOM + Screenshot |
|---|---|---|---|
| Visuelle Orientierung | ❌ | ✅ | ✅ |
| Präzises Highlighting | ✅ (CSS-Selector) | ❌ (Pixel-Koordinaten) | ✅ |
| Kosten | günstig | teurer (Vision-Tokens) | mittel |
| Versteht Layout | ❌ | ✅ | ✅ |
| Highlighting-Genauigkeit | pixel-perfekt | ungenau | pixel-perfekt |

DOM gibt Claude die Struktur + Selektoren. Screenshot gibt Claude das visuelle
Layout — wie ein Mensch die Seite sieht. Zusammen ist das stärker als Clicky.

---

### Schritt 1: DOM-Snapshot (Struktur + Selektoren)

```typescript
// dom-context.ts
function getDOMSnapshot() {
  const elements = document.querySelectorAll(
    'button, a, input, select, h1, h2, h3, nav, [role], [aria-label], [data-testid]'
  );

  return Array.from(elements)
    .filter(el => isVisible(el))
    .map(el => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim().slice(0, 100),
      selector: getUniqueSelector(el),   // z.B. "nav > .upgrade-btn"
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      boundingBox: el.getBoundingClientRect(), // Position auf der Seite
    }));
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}
```

---

### Schritt 2: Screenshot (Visueller Kontext)

```typescript
// screenshot.ts
import html2canvas from 'html2canvas';

async function captureScreenshot(): Promise<string> {
  const canvas = await html2canvas(document.body, {
    scale: 0.5,          // Halbgröße → weniger Tokens, schneller
    useCORS: true,
    allowTaint: false,
    logging: false,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    y: window.scrollY,   // Aktueller Scroll-Stand
  });

  // Als Base64 JPEG (günstiger als PNG für Vision-Tokens)
  return canvas.toDataURL('image/jpeg', 0.7);
}
```

Screenshot wird nur beim Abschicken einer Frage gemacht — nicht kontinuierlich.
Das hält die Kosten niedrig.

---

### Schritt 3: Kombinierter API-Call an Claude

```typescript
// Im Backend: chat.ts
async function buildClaudeMessages(input: ChatInput) {
  return [
    {
      role: 'user',
      content: [
        // 1. Screenshot als Bild
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: input.screenshot_base64,
          },
        },
        // 2. DOM-Snapshot als strukturierter Text
        {
          type: 'text',
          text: `
Aktuelle URL: ${input.current_url}
Seiten-Titel: ${input.page_title}

DOM-Elemente (sichtbar):
${JSON.stringify(input.dom_snapshot, null, 2)}

Nutzer-Frage: ${input.question}
          `.trim(),
        },
      ],
    },
  ];
}
```

Claude sieht: das Bild der Seite (visuell) + alle Elemente mit ihren Selektoren
(strukturell). Damit kann Claude sowohl visuell orientieren als auch
pixel-perfekt highlighten.

---

### Wie Claude "zeigt"

Claude gibt in seiner Antwort spezielle Tags zurück:

```
Der Upgrade-Button ist oben rechts. [HIGHLIGHT: nav .upgrade-btn]
Klicke dann auf Settings. [HIGHLIGHT: #sidebar-settings]
```

Das Widget parst diese Tags, entfernt sie aus dem sichtbaren Text,
und zeichnet einen animierten Ring um das jeweilige Element — via CSS-Selector,
nicht via Pixel-Koordinaten. Dadurch ist das Highlighting immer exakt,
auch wenn der Nutzer gescrollt hat.

### Highlighter Implementation

```typescript
// highlighter.ts
function highlightElement(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  
  // Scroll ins Sichtfeld
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Animierter pulsierender Ring (wie Clicky)
  const ring = document.createElement('div');
  ring.className = 'widget-highlight-ring';
  ring.style.cssText = `
    position: fixed;
    border: 3px solid #3B82F6;
    border-radius: 8px;
    animation: widget-pulse 1.5s ease-in-out infinite;
    pointer-events: none;
    z-index: 999999;
  `;
  
  // Ring positionieren basierend auf Element-Position
  const rect = el.getBoundingClientRect();
  ring.style.top = `${rect.top - 4}px`;
  ring.style.left = `${rect.left - 4}px`;
  ring.style.width = `${rect.width + 8}px`;
  ring.style.height = `${rect.height + 8}px`;
  
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 4000); // Nach 4 Sek. verschwinden
}
```

---

## Widget UI (Clicky-Style)

### Minimiert (Standard)
- Kleiner floating Button unten rechts (56px rund)
- Subtiles AI-Icon, keine auffällige Farbe
- Klick → öffnet Chat-Panel

### Aufgeklappt
- Chat-Panel (320px breit, 480px hoch) neben dem Button
- Text-Input unten: "Wie kann ich meinen Plan upgraden?"
- Antwort erscheint als Bubble + TTS startet automatisch
- Pause-Button für Audio
- Powered by [Dein Name] Badge unten (viraler Loop)

### Shadow DOM
Das gesamte Widget läuft in einem Shadow DOM — kein CSS-Konflikt
mit der Host-Website möglich, egal wie die gestylt ist.

---

## API Routes

### POST /chat
```
Input: {
  question: string,
  screenshot_base64: string,   // JPEG, 0.5x scale, aktueller Viewport
  dom_snapshot: DOMElement[],  // Nur sichtbare Elemente mit Selektoren
  current_url: string,
  page_title: string,
  conversation_history: Message[],
  api_key: string
}
Output: SSE Stream { text, highlights: string[] }
```

Claude System Prompt:
```
Du bist ein freundlicher UI-Assistent für {site_name}.
Du hilfst Nutzern, sich auf der Website zurechtzufinden.

Du erhältst:
1. Einen Screenshot der aktuellen Seite (visueller Kontext)
2. Eine Liste aller sichtbaren DOM-Elemente mit CSS-Selektoren (struktureller Kontext)

Wenn du auf ein Element verweist, füge [HIGHLIGHT: selector] direkt nach der
entsprechenden Aussage ein. Nutze ausschließlich Selektoren aus der DOM-Liste.
Antworte kurz und präzise. Max. 2-3 Sätze. Wenn mehrere Schritte nötig sind,
erkläre nur den nächsten Schritt.
```

### POST /tts
```
Input:  { text: string }
Output: audio/mpeg stream
```

---

## Script-Tag Integration (für SaaS-Kunden)

So einfach wie möglich:

```html
<script
  src="https://cdn.yourwidget.com/widget.js"
  data-api-key="cust_abc123"
  data-site-name="MeinSaaS"
  data-color="#3B82F6"
  defer
></script>
```

Das ist alles. Widget initialisiert sich selbst, liest Config aus den data-Attributen.

---

## Demo-Site (zum Testen)

Eine glaubwürdige Fake-SaaS-App mit:
- Dashboard mit Sidebar-Navigation
- Settings-Seite mit Plan-Upgrade Button
- Team-Seite mit Invite-Formular
- Billing-Seite

Deployed auf Vercel → öffentlicher Demo-Link für Marketing.
Widget ist bereits eingebunden und voll funktionsfähig.

---

## Umgebungsvariablen

```env
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ALLOWED_ORIGINS=*        # Im MVP, später per API-Key beschränken
PORT=3000
```

---

## Build-Reihenfolge für Claude Code

1. Widget: Grundstruktur mit Shadow DOM + Floating Button
2. Widget: DOM-Snapshot Logik (dom-context.ts) inkl. getUniqueSelector + isVisible
3. Widget: Screenshot Logik (screenshot.ts) mit html2canvas, 0.5x scale, JPEG
4. Widget: Chat-Panel UI (Preact)
5. Backend: Hono Setup + /chat Route mit Claude + Advisor
6. Backend: Kombinierter Claude-Call (Screenshot als Image-Block + DOM als Text-Block)
7. Widget: SSE Streaming vom Backend empfangen + Text anzeigen
8. Widget: HIGHLIGHT-Tag Parser + Highlighter Ring (CSS-Selector basiert)
9. Backend: /tts Route mit ElevenLabs
10. Widget: AudioPlayer + Auto-Play nach Antwort
11. Demo-Site: Fake-SaaS UI bauen (Dashboard, Settings, Billing, Team)
12. Demo-Site: Widget einbinden + End-to-End testen
13. Deploy: Widget-Script auf Cloudflare CDN, Backend auf Cloudflare Workers

---

## Out of Scope (MVP)

- Dashboard für SaaS-Kunden
- API-Key Management
- Analytics (Welche Fragen stellen Nutzer?)
- Per-Customer Customization (Farbe, Stimme)
- Rate Limiting pro API-Key
- Mehrsprachigkeit

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
