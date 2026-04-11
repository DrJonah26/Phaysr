# Clicky → Phaysr: Feature-Vergleich & Analyse

## Feature-Vergleich

| Feature | Clicky | Phaysr | Übertragbar? |
|---|---|---|---|
| Annotation-Mechanismus | `[POINT:x,y:label]` – absolute Pixelkoordinaten | `SELECTOR:<css>` – DOM-Selektor | ✅ Verschiedene Ansätze, siehe unten |
| Streaming | SSE via `URLSession.bytes` | SSE via Fetch API + AsyncGenerator | ✅ Gleiche Idee |
| Advisor-Tool (zweistufig) | Nein | ✅ Ja (Opus als Advisor, Haiku als Executor) | — |
| Multi-Monitor-Support | ✅ Ja (per-screen Overlay) | N/A (Browser) | ❌ |
| Animierter Cursor | ✅ Bézier-Arc, Rotation, Scale-Pulse | ❌ Nur Ring-Highlight | ⭐ Interessant zu portieren |
| Scroll-into-view | N/A (Koordinaten-basiert) | ✅ `scrollIntoView({ behavior: 'smooth', block: 'center' })` | — |
| Deferred Highlight | N/A | ✅ MutationObserver (8s timeout) | — |
| Auto-Continuation | N/A | ✅ `ELEMENT_CLICKED_EVENT` → `[CONTINUE]` | — |
| TTS | ✅ ElevenLabs (streaming) | ❌ Deaktiviert (MVP) | ⭐ Ready to enable |
| Screenshot | ✅ ScreenCaptureKit (native) | ✅ html2canvas (JPEG 0.5x) | — |
| Konversations-History | ✅ Tuple-Array | ✅ Message-Array | — |
| Onboarding-Flow | ✅ Video + Demo-Pointing | ❌ Keiner | ⭐ Nice-to-have |
| Analytics | ✅ PostHog | ❌ | ⭐ Portierbar |

---

## 1. System-Prompt: POINT-Tags → HIGHLIGHT adaptieren

**Clicky (POINT)** – Koordinatenbasiert:
```
[POINT:x,y:label]         → einzelner Bildschirm
[POINT:x,y:label:screen2] → zweiter Monitor
[POINT:none]              → kein Element hervorheben
```
Das setzt voraus, dass Claude die Screenshot-Pixelkoordinaten kennt und `ElementLocationDetector` diese via Computer-Use-API verifiziert.

**Phaysr (SELECTOR)** – DOM-basiert:
```
SELECTOR:[data-testid="upgrade-plan-btn"]
```
Besser für Web-Embeds, weil:
- Stabil bei Scrolling/Resize (kein Koordinaten-Drift)
- Direkt mit DOM-Snapshot verknüpft
- Kein Computer-Use-API-Call nötig

### Was von Clicky's Prompt-Struktur übernommen werden kann

Clicky's Prompt (`CompanionManager.swift:561-576`) hat diese Regeln die Phaysr fehlen:

- **Fallback explizit benennen**: `[POINT:none]` → Phaysr braucht `SELECTOR:none` für den Fall dass kein Element passt
- **Label mitgeben**: Clicky hat `[POINT:x,y:label]` – erweiterbar auf `SELECTOR:<css>|<label>` für besseres Debugging
- **Constraint auf sichtbare Elemente**: Clicky begrenzt auf 20%-80% des Bildschirms (Onboarding-Prompt). Phaysr macht das implizit durch `isVisible()`, aber der Prompt könnte das expliziter fordern
- **"Wenn nicht sichtbar, erkläre NUR Navigation"**: Phaysr hat das bereits (`chat.ts:28`), identisch zu Clickys Ansatz

---

## 2. Edge Cases beim Animieren

### Off-Screen Elemente

**Clicky** löst das per Koordinaten-Clamp (`OverlayWindow.swift:471-474`):
```swift
target.x = max(screenBounds.minX + 20, min(screenBounds.maxX - 20, target.x))
target.y = max(screenBounds.minY + 20, min(screenBounds.maxY - 20, target.y))
```
Kein Scroll – der Cursor fliegt zum nächstmöglichen Punkt am Rand.

**Phaysr** nutzt `scrollIntoView` (`highlighter.ts:33`):
```typescript
target.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

**Offenes Problem in Phaysr**: Der Ring wird sofort gezeichnet, bevor der Scroll abgeschlossen ist → Ring sitzt kurz an falscher Position.

Fix-Option A – Fester Delay:
```typescript
await new Promise(r => setTimeout(r, 300));
// Dann Ring zeichnen
```

Fix-Option B – `scrollend`-Event (Chrome 114+, Safari 17+):
```typescript
await new Promise(r => target.addEventListener('scrollend', r, { once: true }));
```

### Weitere Edge Cases

| Case | Clicky | Phaysr | Status |
|---|---|---|---|
| Scroll während Animation | Kein Scroll (Koordinaten) | 200ms Reposition-Loop | ✅ Abgedeckt, aber initialer Delay fehlt |
| Element in `display:none` Parent | N/A | `getBoundingClientRect()` gibt 0 zurück | ❌ Unbehandelt |
| Sticky Header überdeckt Element | N/A | `scrollIntoView` ignoriert sticky offset | ❌ Braucht `scroll-margin-top` oder manuelle Berechnung |
| Element in iFrame (cross-origin) | Screenshot-basiert → kein Problem | `querySelector` schlägt fehl | ❌ Strukturell nicht lösbar |
| Modal/Dialog öffnet sich verzögert | N/A | MutationObserver (8s) | ✅ Abgedeckt |

---

## 3. Streaming-Koordination

### Clicky (`ClaudeAPI.swift:155-208`)

```
URLSession.bytes → SSE-Parser → onTextChunk callback → AccumulatedText
→ nach Stream-Ende: POINT-Tag parsen → ElementLocationDetector → Cursor-Animation
```

Text-Streaming ist ein No-Op (`{ _ in }`) – alles passiert am Ende. Einfacher, aber schlechteres UX (kein Live-Text).

### Phaysr (`chat.ts:159-182` + `app.tsx:85-112`)

```
Claude stream → fullText akkumulieren
→ nach Stream-Ende: SELECTOR parsen → getrennte SSE-Events senden
  event:text      → Delta-Updates im Frontend (live)
  event:highlight → highlightElement() aufrufen
  event:advisor   → Thinking-Indikator
  event:done      → Stream beenden
```

Text-Deltas werden live gestreamt (besseres UX). SELECTOR-Parsing passiert erst nach vollem Text – korrekt, weil SELECTORs immer am Ende stehen.

### Gemeinsames Problem: Stream-Abbruch

Wenn der Stream abbricht, werden SELECTORs (bzw. POINT-Tags) nicht gesendet → kein Highlight. Beide Tools haben dieses Problem unbehandelt.

### Was Phaysr von Clicky lernen kann

- Clicky hat explizites `[POINT:none]` als Signal – Phaysr sollte `SELECTOR:none` im Prompt explizit fordern (macht es noch nicht)
- Clickys Onboarding-Prompt zwingt das Modell zu "ONLY comment + POINT tag" → für einen Phaysr "Tour-Modus" wäre eine ähnlich strenge Mode sinnvoll

---

## Empfehlungen: Was sich lohnt zu portieren

### Sofort umsetzbar (low effort, high value)

1. **TTS aktivieren** – Backend-Route und ElevenLabs-Key sind vorbereitet, nur `tts.ts` implementieren
2. **`SELECTOR:none` im Prompt explizit verlangen** – verhindert halluzinierte Selektoren
3. **Scroll-Delay vor Ring-Draw** – 300ms warten nach `scrollIntoView`

### Mittelfristig (medium effort)

4. **Bézier-Cursor-Animation** statt statischem Ring – würde Phaysr deutlich mehr "Leben" geben
   - Clicky: `OverlayWindow.swift:495-567` als Referenz
   - Quadratic Bézier Arc, Rotation via Tangente, Scale-Pulse via `sin(t * π)`
5. **Analytics (PostHog)** – Clicky hat das sauber abstrahiert in `ClickyAnalytics.swift`
6. **Tour-Modus** (Onboarding-ähnlich) – strukturierte Demo-Sequenz wie Clickys Onboarding-Video

### Nicht portierbar

- Multi-Monitor-Support (Browser-Kontext hat kein Äquivalent)
- ScreenCaptureKit → html2canvas ist der richtige Browser-Ersatz
- Native Hotkeys (Push-to-Talk via CGEvent) → Browser hat nur `keydown`-Events

---

## Referenz: Schlüsseldateien

### Clicky
| Datei | Zweck |
|---|---|
| `leanring-buddy/CompanionManager.swift` | Zentraler State-Machine, System-Prompts, POINT-Tag-Parsing |
| `leanring-buddy/OverlayWindow.swift` | Cursor-Animationen, Bézier-Arc, Off-Screen-Handling |
| `leanring-buddy/ClaudeAPI.swift` | SSE-Streaming-Implementierung |
| `leanring-buddy/ElementLocationDetector.swift` | Computer-Use-API für Koordinaten-Verifikation |
| `worker/src/index.ts` | Cloudflare Worker API-Proxy |

### Phaysr
| Datei | Zweck |
|---|---|
| `backend/src/routes/chat.ts` | System-Prompt, SELECTOR-Parsing, SSE-Events |
| `widget/src/core/highlighter.ts` | Ring-Animation, scrollIntoView, MutationObserver |
| `widget/src/core/sse-client.ts` | SSE-Client (AsyncGenerator) |
| `widget/src/ui/app.tsx` | Message-Flow, Auto-Continuation |
| `widget/src/core/dom-context.ts` | DOM-Snapshot, isVisible-Filter |
