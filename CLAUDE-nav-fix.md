# Navigation Detection Fix — CLAUDE.md Task

Verbessere die Logik die erkennt ob ein Seitenwechsel erwartet wird.
Problem: Claude gibt manchmal CONTINUE:no zurück obwohl kein echter
Seitenwechsel kommt (z.B. bei Buttons die Modals öffnen).

Ziel: Code-seitige Verifikation statt blindes Vertrauen auf Claudes CONTINUE:no.

---

## Kontext

In `widget/src/ui/app.tsx` gibt es folgende Logik:

```typescript
const waitingForNav = aiCanContinue === 'no' && goalActive;
```

Wenn `waitingForNav` true ist, zeigt das Widget "Waiting for navigation..."
und wartet bis sich die Seite ändert. Das Problem: Claude sagt manchmal
`CONTINUE:no` für Buttons/Dropdowns die gar nicht navigieren.

Die Lösung: Prüfe im Code selbst ob das geHighlightete Element wirklich
ein Navigations-Element ist, bevor du auf Navigation wartest.

---

## Fix 1: lastHighlightedSelector tracken

**Datei:** `widget/src/ui/app.tsx`

Füge direkt nach dieser Zeile:
```typescript
let aiCanContinue: 'yes' | 'no' | 'done' = 'yes';
```

Diese neue Variable hinzu:
```typescript
let lastHighlightedSelector = 'none';
```

Dann im stream loop, nach dem bestehenden `ev.type === 'highlight'` Block:

```typescript
// Vorher:
} else if (ev.type === 'highlight') {
  highlightElement(ev.selector, config.color);
}

// Nachher:
} else if (ev.type === 'highlight') {
  lastHighlightedSelector = ev.selector; // NEU — letzten Selector merken
  highlightElement(ev.selector, config.color);
}
```

---

## Fix 2: isNavigationElement() Funktion

**Datei:** `widget/src/core/dom-context.ts`

Füge diese neue exportierte Funktion am Ende der Datei hinzu
(nach `getDOMSnapshot` und nach `getInputValues` falls bereits vorhanden):

```typescript
/**
 * Prüft ob ein Element wirklich zu einem Seitenwechsel führt.
 * Nur echte <a href> Links in nav/sidebar gelten als Navigation.
 * Buttons, Dropdowns, Modals, Toggles → false.
 */
export function isNavigationElement(selector: string): boolean {
  if (!selector || selector === 'none') return false;

  let el: Element | null = null;
  try {
    el = document.querySelector(selector);
  } catch {
    return false;
  }

  if (!el) return false;

  // Regel 1: <a> Tag mit echtem href (nicht "#" oder "javascript:")
  if (el.tagName === 'A') {
    const href = (el as HTMLAnchorElement).getAttribute('href') ?? '';
    const isRealLink = href.length > 0 && href !== '#' && !href.startsWith('javascript:');
    if (isRealLink) return true;
  }

  // Regel 2: Element ist ein Button oder hat role="button" → KEIN Navigation
  if (el.tagName === 'BUTTON') return false;
  if (el.getAttribute('role') === 'button') return false;

  // Regel 3: Element hat onClick oder data-action → wahrscheinlich kein Nav
  // (Heuristik: wenn es data-testid hat das mit "btn" endet, ist es ein Button)
  const testId = el.getAttribute('data-testid') ?? '';
  if (testId.endsWith('-btn') || testId.endsWith('-button')) return false;

  // Regel 4: Element ist in einem nav oder aside → könnte Navigation sein
  // aber nur wenn es ein <a> Tag ist (bereits oben geprüft)
  // Alles andere in nav → kein echter Page-Change
  return false;
}
```

---

## Fix 3: isNavigationElement in app.tsx verwenden

**Datei:** `widget/src/ui/app.tsx`

Schritt 3a — Import erweitern oben in der Datei:

```typescript
// Vorher:
import { getDOMSnapshot } from '../core/dom-context.js';

// Nachher:
import { getDOMSnapshot, isNavigationElement } from '../core/dom-context.js';
```

Schritt 3b — `waitingForNav` Berechnung ändern:

```typescript
// Vorher:
const waitingForNav = aiCanContinue === 'no' && goalActive;

// Nachher:
const isRealNavigation = isNavigationElement(lastHighlightedSelector);
const waitingForNav = aiCanContinue === 'no' && goalActive && isRealNavigation;
```

Das ist der Kern des Fixes. Wenn Claude `CONTINUE:no` sagt aber das
Element kein echter Nav-Link ist → `waitingForNav` bleibt false →
Widget zeigt "Waiting for navigation" NICHT an → kein false positive.

---

## Fix 4: Fallback wenn CONTINUE:no aber kein Nav-Element

**Datei:** `widget/src/ui/app.tsx`

Wenn Claude `CONTINUE:no` sagt aber `isRealNavigation` false ist,
soll das Widget trotzdem weitermachen — behandle es wie `CONTINUE:yes`.

Erweitere die bestehende Logik nach der `waitingForNav` Berechnung:

```typescript
// Bestehender Code:
const goalDone = aiCanContinue === 'done';
const goalActive = !goalDone && !!activeGoalRef.current && continueStepCountRef.current < MAX_CONTINUE_STEPS;
const showContinueButton = aiCanContinue === 'yes' && goalActive;
const waitingForNav = aiCanContinue === 'no' && goalActive && isRealNavigation;

// NEU — Fallback: CONTINUE:no aber kein echter Nav-Link → treat as CONTINUE:yes
const continueNoButNotNav = aiCanContinue === 'no' && goalActive && !isRealNavigation;
const showContinueButton = (aiCanContinue === 'yes' || continueNoButNotNav) && goalActive;
```

WICHTIG: Ersetze die bestehende `showContinueButton` Zeile komplett —
sie ist jetzt oben bereits neu definiert. Entferne die alte Definition.

---

## Fix 5: Timeout von 6s auf 3s reduzieren

**Datei:** `widget/src/ui/app.tsx`

Im `useEffect` Interval, ändere den Timeout:

```typescript
// Vorher:
} else if (Date.now() - navWatchStartRef.current > 6000) {

// Nachher:
} else if (Date.now() - navWatchStartRef.current > 3000) {
```

Begründung: Wenn doch ein falsches Nav-Wait ausgelöst wird,
erholt sich das Widget jetzt in 3s statt 6s.

---

## Fix 6: Zusätzliche Sicherheit — DOM-Snapshot Nav-Check

**Datei:** `widget/src/core/dom-context.ts`

Erweitere `isNavigationElement` um einen zusätzlichen Check via DOM-Snapshot.
Manchmal ist der Selector ein Wrapper-Element — prüfe auch die Kinder:

```typescript
// Am Ende von isNavigationElement(), vor dem finalen return false:

// Regel 5: Prüfe ob ein Kind-Element ein echter Nav-Link ist
const childLink = el.querySelector('a[href]');
if (childLink) {
  const href = (childLink as HTMLAnchorElement).getAttribute('href') ?? '';
  const isRealLink = href.length > 0 && href !== '#' && !href.startsWith('javascript:');
  if (isRealLink) return true;
}

return false;
```

---

## Testreihenfolge nach allen Fixes

**Test 1 — False Positive verhindern (wichtigster Test):**
- Frage: "how do I upgrade my plan?"
- Schritt 1: AI zeigt Upgrade-Button → CONTINUE:yes erwartet
- Erwartung: Widget zeigt Continue-Button, NICHT "Waiting for navigation"
- Vorher: AI sagte manchmal CONTINUE:no für den Upgrade-Button

**Test 2 — Echter Seitenwechsel funktioniert noch:**
- Frage: "go to billing page"
- Erwartung: AI zeigt Billing-Link in Sidebar → CONTINUE:no
- Widget zeigt "Waiting for navigation"
- Du klickst auf Billing → Widget erkennt Seitenwechsel → nächster Schritt

**Test 3 — Modal/Dropdown:**
- Frage: "select the pro plan"
- Erwartung: AI zeigt Plan-Button → CONTINUE:yes
- Widget zeigt Continue, kein Nav-Wait

**Test 4 — Timeout Fallback:**
- Erzwinge ein Nav-Wait (z.B. durch manuelles Testen)
- Tue nichts für 3 Sekunden
- Erwartung: Widget beendet den Nav-Wait automatisch nach 3s

---

## Was NICHT geändert wird

- System-Prompt bleibt unverändert
- SSE-Streaming-Logik bleibt unverändert
- TTS bleibt deaktiviert
- MutationObserver-Logik für deferred highlights bleibt unverändert
- getInputValues() falls bereits implementiert bleibt unverändert

---

## Git Commit Strategie

Nach jedem Fix einen separaten Commit:

```
fix: track lastHighlightedSelector in stream loop
feat: add isNavigationElement() to dom-context
fix: use isNavigationElement before setting waitingForNav
fix: treat CONTINUE:no without nav element as CONTINUE:yes
fix: reduce nav wait timeout from 6s to 3s
fix: check child links in isNavigationElement
```
