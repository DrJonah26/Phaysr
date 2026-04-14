import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { WidgetConfig } from '../config.js';
import { getDOMSnapshot, getInputValues, isNavigationElement } from '../core/dom-context.js';
import { captureScreenshot } from '../core/screenshot.js';
import {
  highlightElement,
  clearHighlights,
  showGuideOutput,
  hideGuideOutput,
  collapseGuideOutput,
} from '../core/highlighter.js';
import { streamChat } from '../core/sse-client.js';

const MAX_CONTINUE_STEPS = 6;

/** Stable fingerprint that changes whenever the visible "page" changes —
 *  works for URL-based routing, SPA history routing, and pure state-based
 *  routing (like the demo site) that only swaps the h1/title. */
function getPageFingerprint(): string {
  const h1 = document.querySelector('h1')?.textContent?.trim() ?? '';
  return `${window.location.href}|${document.title}|${h1}`;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'continuation';
  content: string;
}

interface AppProps {
  config: WidgetConfig;
  hostElement: HTMLElement;
}

export function App({ config, hostElement }: AppProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLoadingRef = useRef(false);
  const historyRef = useRef<ConversationMessage[]>([]);
  const activeGoalRef = useRef<string | null>(null);
  const continueStepCountRef = useRef(0);
  const lastAssistantTextRef = useRef('');
  const expectingNavRef = useRef(false);
  const navWatchUrlRef = useRef('');
  const sendMessageRef = useRef<(question: string, isContinuation: boolean, skipContext?: boolean) => Promise<void>>(async () => undefined);

  const handleContinue = useCallback(() => {
    const goal = activeGoalRef.current;
    if (!goal || isLoadingRef.current) return;

    if (continueStepCountRef.current >= MAX_CONTINUE_STEPS) {
      activeGoalRef.current = null;
      showGuideOutput({
        text: lastAssistantTextRef.current,
        color: config.color,
        canContinue: false,
      });
      return;
    }

    continueStepCountRef.current += 1;
    void sendMessageRef.current(goal, true, false);
  }, [config.color]);

  const sendMessage = useCallback(async (question: string, isContinuation = false, skipContext = false) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    clearHighlights();

    // When user clicks Continue (same page): inject a fake exchange into history
    // so Claude sees its own confirmation that the step was completed.
    // This is far more reliable than system prompt rules.
    if (isContinuation && skipContext) {
      historyRef.current.push({ role: 'continuation', content: 'Done.' });
      historyRef.current.push({ role: 'assistant', content: 'Step completed.' });
    }

    const apiQuestion = isContinuation
      ? (skipContext
          ? 'What is the next step?'
          : `[CONTINUE] ${question}`)
      : question;

    const history = historyRef.current.map((m) => ({
      role: (m.role === 'continuation' ? 'user' : m.role) as 'user' | 'assistant',
      content: m.content,
    }));

    historyRef.current.push({
      role: isContinuation ? 'continuation' : 'user',
      content: apiQuestion,
    });

    let snapshot: ReturnType<typeof getDOMSnapshot> | undefined;
    let screenshot = '';
    let inputValues: ReturnType<typeof getInputValues> = [];
    let assistantText = '';
    let aiCanContinue: 'yes' | 'no' | 'done' = 'yes';
    let lastHighlightedSelector = 'none';
    let hadError = false;

    // Visually hide guide output while AI loads — keeps position/cursor state intact
    collapseGuideOutput();

    try {
      snapshot = getDOMSnapshot(hostElement);
      screenshot = await captureScreenshot(hostElement);
      inputValues = getInputValues(hostElement);
    } catch {
      // continue without screenshot context
    }

    try {
      const stream = streamChat({
        backendUrl: config.backendUrl,
        body: {
          question: apiQuestion,
          screenshot_base64: screenshot,
          dom_snapshot: snapshot ?? [],
          input_values: inputValues,
          current_url: window.location.href,
          page_title: document.title,
          conversation_history: history,
          site_name: config.siteName,
          api_key: config.apiKey,
          site_context: config.context || undefined,
        },
      });

      for await (const ev of stream) {
        if (ev.type === 'text') {
          assistantText += ev.delta;
          lastAssistantTextRef.current = assistantText;
          showGuideOutput({
            text: assistantText,
            color: config.color,
            isLoading: true,
            canContinue: false,
          });
        } else if (ev.type === 'highlight') {
          lastHighlightedSelector = ev.selector;
          highlightElement(ev.selector, config.color);
        } else if (ev.type === 'can_continue') {
          aiCanContinue = ev.value;
        } else if (ev.type === 'error') {
          hadError = true;
          assistantText = assistantText || `Fehler: ${ev.message}`;
          lastAssistantTextRef.current = assistantText;
          showGuideOutput({
            text: assistantText,
            color: config.color,
            isLoading: false,
            canContinue: false,
          });
        } else if (ev.type === 'done') {
          // stream complete
        }
      }
    } catch (err) {
      hadError = true;
      console.error('[widget] stream failed', err);
      assistantText = assistantText || 'Fehler: Verbindung zum Backend fehlgeschlagen.';
      lastAssistantTextRef.current = assistantText;
      showGuideOutput({
        text: assistantText,
        color: config.color,
        isLoading: false,
        canContinue: false,
      });
    }

    const finalText = assistantText.trim() || (hadError ? 'Fehler beim Abruf der Antwort.' : 'Schritt markiert.');
    lastAssistantTextRef.current = finalText;
    historyRef.current.push({ role: 'assistant', content: finalText });

    const goalDone = aiCanContinue === 'done';
    const goalActive = !goalDone && !!activeGoalRef.current && continueStepCountRef.current < MAX_CONTINUE_STEPS;
    const isRealNavigation = isNavigationElement(lastHighlightedSelector);
    const waitingForNav = aiCanContinue === 'no' && goalActive && isRealNavigation;
    const continueNoButNotNav = aiCanContinue === 'no' && goalActive && !isRealNavigation;
    const showContinueButton = (aiCanContinue === 'yes' || continueNoButNotNav) && goalActive;

    if (!goalActive || goalDone) {
      activeGoalRef.current = null;
      continueStepCountRef.current = 0;
      expectingNavRef.current = false;
    } else if (waitingForNav) {
      expectingNavRef.current = true;
      navWatchUrlRef.current = getPageFingerprint();
      navWatchStartRef.current = Date.now();
    } else {
      expectingNavRef.current = false;
    }

    showGuideOutput({
      text: finalText,
      color: config.color,
      isLoading: false,
      canContinue: showContinueButton,
      onContinue: showContinueButton ? handleContinue : undefined,
      continueLabel: 'Continue',
      waitingForNav,
      isDone: goalDone,
    });

    isLoadingRef.current = false;
    setIsLoading(false);
  }, [config, hostElement, handleContinue]);

  sendMessageRef.current = sendMessage;

  const handleSend = useCallback(() => {
    const question = input.trim();
    if (!question || isLoadingRef.current) return;

    setInput('');
    activeGoalRef.current = question;
    continueStepCountRef.current = 0;
    expectingNavRef.current = false;
    void sendMessageRef.current(question, false);
  }, [input]);

  const handleInputKeyDown = useCallback((e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Auto-trigger next step when user navigates to a new page (CONTINUE:no flow)
  // Fallback: if no navigation detected after 6s, treat as done and clear state.
  const navWatchStartRef = useRef(0);
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!expectingNavRef.current || isLoadingRef.current) return;
      const goal = activeGoalRef.current;
      if (!goal) return;

      if (getPageFingerprint() !== navWatchUrlRef.current) {
        expectingNavRef.current = false;
        // Page navigated — keep guide block in place, show Continue so user triggers next step
        showGuideOutput({
          text: lastAssistantTextRef.current,
          color: config.color,
          canContinue: true,
          onContinue: handleContinue,
          continueLabel: 'Continue',
        });
      } else if (Date.now() - navWatchStartRef.current > 3000) {
        // No navigation after 3s — silently stop waiting
        expectingNavRef.current = false;
        activeGoalRef.current = null;
        continueStepCountRef.current = 0;
        showGuideOutput({
          text: lastAssistantTextRef.current,
          color: config.color,
          isDone: true,
        });
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [config.color, handleContinue]);

  useEffect(() => () => {
    clearHighlights();
    hideGuideOutput();
  }, []);

  return (
    <div class="root">
      <div class="input-dock">
        <input
          class="dock-input"
          type="text"
          placeholder="Type here..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
        />
        <button
          class="dock-send"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
