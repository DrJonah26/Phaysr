# Phaysr Stability Fixes — CLAUDE.md Task

Du bekommst die vollständige Codebase von Phaysr. Implementiere die folgenden
Fixes exakt in der angegebenen Reihenfolge. Teste nach jedem Fix manuell bevor
du weitermachst.

---

## Kontext

Phaysr ist ein B2B Web-Widget das als Script-Tag eingebunden wird. Es nimmt
DOM-Snapshots + Screenshots der aktuellen Seite, schickt sie an Claude, und
highlightet Elemente via CSS-Selektoren. Das Widget führt Nutzer Schritt für
Schritt durch Multi-Step-Flows.

Das Hauptproblem: bei Continue-Klicks wird ein veralteter Screenshot/Snapshot
geschickt — Claude sieht nicht was der User inzwischen eingegeben hat.

---

## Fix 1: skipContext entfernen (WICHTIGSTER FIX)

**Datei:** `widget/src/ui/app.tsx`

Suche diese Zeile:
```typescript
void sendMessageRef.current(goal, true, true);
```

Ersetze sie mit:
```typescript
void sendMessageRef.current(goal, true, false);
```

Das ist eine einzige Zeile. Dieser Fix sorgt dafür dass bei jedem
Continue-Klick ein frischer Screenshot + frischer DOM-Snapshot gemacht wird.
Dadurch sieht Claude was der User inzwischen eingegeben hat.

**Test nach diesem Fix:**
1. Demo-Site öffnen
2. "create a new project" eingeben
3. AI zeigt das Formular
4. Namen eingeben
5. Continue klicken
6. AI sollte jetzt erkennen dass der Name eingegeben wurde und zum Submit weitergehen

---

## Fix 2: getInputValues() zu dom-context.ts hinzufügen

**Datei:** `widget/src/core/dom-context.ts`

Füge diese Funktion am Ende der Datei hinzu (nach `getDOMSnapshot`):

```typescript
export interface InputValueSnapshot {
  selector: string;
  value: string;
  placeholder: string | null;
  type: string | null;
}

export function getInputValues(excludeRoot?: Element | null): InputValueSnapshot[] {
  const inputs = document.querySelectorAll('input, textarea, select');
  const result: InputValueSnapshot[] = [];

  for (const el of Array.from(inputs)) {
    if (excludeRoot && excludeRoot.contains(el)) continue;
    if (!isVisible(el)) continue;

    const value = (el as HTMLInputElement).value?.trim() ?? '';
    if (!value) continue; // nur ausgefüllte Felder

    result.push({
      selector: getUniqueSelector(el),
      value: value.slice(0, 200),
      placeholder: el.getAttribute('placeholder'),
      type: el.getAttribute('type'),
    });
  }

  return result;
}
```

---

## Fix 3: InputValueSnapshot in types.ts hinzufügen

**Datei:** `backend/src/types.ts`

Füge dieses Interface hinzu (nach `DOMElementSnapshot`):

```typescript
export interface InputValueSnapshot {
  selector: string;
  value: string;
  placeholder: string | null;
  type: string | null;
}
```

Erweitere `ChatRequestBody` um das neue Feld:

```typescript
export interface ChatRequestBody {
  question: string;
  screenshot_base64: string;
  dom_snapshot: DOMElementSnapshot[];
  current_url: string;
  page_title: string;
  conversation_history: ChatMessage[];
  site_name?: string;
  api_key?: string;
  site_context?: string;
  input_values?: InputValueSnapshot[]; // NEU
}
```

---

## Fix 4: input_values in app.tsx mitschicken

**Datei:** `widget/src/ui/app.tsx`

Schritt 4a — Import erweitern oben in der Datei:

```typescript
// Vorher:
import { getDOMSnapshot } from '../core/dom-context.js';

// Nachher:
import { getDOMSnapshot, getInputValues } from '../core/dom-context.js';
```

Schritt 4b — In `sendMessage`, direkt nach der Zeile wo `snapshot` gesetzt wird:

```typescript
// Bestehender Code:
snapshot = getDOMSnapshot(hostElement);
screenshot = await captureScreenshot(hostElement);

// Direkt danach hinzufügen:
const inputValues = getInputValues(hostElement);
```

Schritt 4c — Im fetch body, nach `dom_snapshot`:

```typescript
// Bestehender Code:
dom_snapshot: snapshot ?? [],

// Direkt danach hinzufügen:
input_values: inputValues ?? [],
```

---

## Fix 5: input_values in buildUserContent anzeigen

**Datei:** `backend/src/routes/chat.ts`

In der Funktion `buildUserContent`, nach dem DOM-Snapshot Text-Block,
füge folgenden Block hinzu:

```typescript
// Nach dem bestehenden text-Block mit DOM-Elementen:
if (body.input_values && body.input_values.length > 0) {
  blocks.push({
    type: 'text',
    text: [
      '',
      'Currently filled form fields (user has already typed these):',
      JSON.stringify(body.input_values, null, 2),
      '',
      'IMPORTANT: These fields are already filled. Do NOT ask the user to fill them again.',
    ].join('\n'),
  });
}
```

---

## Fix 6: Selector-Validierung im Backend

**Datei:** `backend/src/routes/chat.ts`

In der `chatRoute.post('/', ...)` Handler-Funktion, nach `extractSelectors`:

```typescript
// Bestehender Code:
const { text, selectors, canContinue } = extractSelectors(fullText);

// Direkt danach hinzufügen:
// Nur Selektoren durchlassen die wirklich im DOM-Snapshot waren
// (verhindert halluzinierte Selektoren)
const domSelectors = new Set(body.dom_snapshot.map(el => el.selector));
const validSelectors = selectors.filter(sel =>
  sel === 'none' || domSelectors.has(sel)
);

// Ab hier validSelectors statt selectors verwenden:
for (const sel of validSelectors.filter((s) => s !== 'none')) {
  await stream.writeSSE({ event: 'highlight', data: JSON.stringify({ selector: sel }) });
}
```

Stelle sicher dass die alte `for`-Schleife über `selectors` entfernt wird
und nur noch die neue über `validSelectors` existiert.

---

## Fix 7: aria-label und name als Selector-Fallback

**Datei:** `widget/src/core/dom-context.ts`

In der Funktion `getUniqueSelector`, nach dem `el.id` Block und vor dem
`parts`-Block, füge folgende Fallbacks hinzu:

```typescript
// Nach dem id-Block:
const ariaLabel = el.getAttribute('aria-label');
if (ariaLabel) {
  const sel = `[aria-label="${ariaLabel}"]`;
  if (isUniqueSelector(sel)) return sel;
}

const nameAttr = el.getAttribute('name');
if (nameAttr) {
  const sel = `${el.tagName.toLowerCase()}[name="${nameAttr}"]`;
  if (isUniqueSelector(sel)) return sel;
}

const placeholder = el.getAttribute('placeholder');
if (placeholder && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
  const sel = `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
  if (isUniqueSelector(sel)) return sel;
}
```

---

## Fix 8: System-Prompt kürzen

**Datei:** `backend/src/routes/chat.ts`

Ersetze die gesamte `buildSystemPrompt` Funktion mit dieser kürzeren Version:

```typescript
function buildSystemPrompt(siteName: string, siteContext?: string): string {
  return [
    `You are a UI assistant for ${siteName}. Help users navigate the website step by step.`,
    '',
    'You receive:',
    '1. A screenshot of the current page',
    '2. A list of visible DOM elements with CSS selectors',
    '3. Currently filled form fields (if any)',
    '',
    'Rules:',
    '- ONE step per answer. Max 2 sentences. No markdown.',
    '- Only reference selectors from the DOM list.',
    '- If form fields are already filled, acknowledge this and move to the next step.',
    '- If element is not on current page, explain navigation only — no SELECTOR.',
    '',
    'End EVERY answer with exactly these two lines:',
    'SELECTOR:<selector-or-none>',
    'CONTINUE:<yes|no|done>',
    '',
    'CONTINUE values:',
    'yes  = more steps follow on this page',
    'no   = user must navigate to a different page first',
    'done = original goal is fully accomplished',
    ...(siteContext ? ['', 'Site context:', siteContext] : []),
  ].join('\n');
}
```

---

## Fix 9: Scroll Race Condition in highlighter.ts

**Datei:** `widget/src/core/highlighter.ts`

Deine `waitForScrollEnd` Funktion ist gut aber wird nicht immer korrekt
awaited. Stelle sicher dass in `drawRingWithCursor` die Reihenfolge stimmt:

```typescript
// Bestehender Code — prüfe dass diese Reihenfolge exakt so ist:
target.scrollIntoView({ behavior: 'smooth', block: 'center' });
await waitForScrollEnd(); // ← muss AWAITED sein, nicht nur aufgerufen

const rect = target.getBoundingClientRect(); // ← erst NACH waitForScrollEnd
lastHighlightRect = rect;
positionGuideOutput();
```

Wenn `waitForScrollEnd()` nicht awaited wird, hat der Ring die falsche Position.
Prüfe ob das `await` wirklich da steht.

---

## Testreihenfolge nach allen Fixes

Teste diese Szenarien in dieser Reihenfolge auf der Demo-Site:

**Test 1 — Einfacher Flow:**
- Frage: "where is billing?"
- Erwartung: Cursor fliegt zu Billing in der Sidebar, Ring erscheint

**Test 2 — Multi-Step mit Text-Input:**
- Frage: "create a new project called Marketing Q3"
- Schritt 1: AI zeigt New Project Button → klicken
- Schritt 2: AI zeigt Name-Feld → "Marketing Q3" eintippen
- Continue klicken
- Erwartung: AI erkennt dass Name eingegeben wurde, zeigt Submit-Button

**Test 3 — Navigation zwischen Seiten:**
- Frage: "how do i upgrade my plan?"
- Erwartung: AI führt durch Billing → Upgrade-Button → Plan auswählen → Confirm

**Test 4 — Unbekanntes Element:**
- Frage: "where is the export button?" (existiert nicht)
- Erwartung: AI sagt ehrlich dass es das nicht sieht, kein halluzinierter Selector

---

## Was NICHT geändert wird

- TTS bleibt deaktiviert (out of scope)
- Dashboard bleibt out of scope
- Advisor-Tool Konfiguration bleibt unverändert
- SSE-Streaming-Logik bleibt unverändert
- Shadow DOM Struktur bleibt unverändert
- Build-Konfiguration bleibt unverändert
