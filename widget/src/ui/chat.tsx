import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'continuation';
  content: string;
  streaming?: boolean;
}

interface ChatPanelProps {
  siteName: string;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  advisorActive: boolean;
  onInput: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export function ChatPanel({
  siteName,
  messages,
  input,
  isLoading,
  advisorActive,
  onInput,
  onSend,
  onClose,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, advisorActive]);

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div class="panel">
      <div class="header">
        <div class="header-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
            <circle cx="9" cy="14" r="1" fill="currentColor" />
            <circle cx="15" cy="14" r="1" fill="currentColor" />
          </svg>
          <span>{siteName} Assistant</span>
        </div>
        <button class="header-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div class="empty-state">
            <strong>Hi! 👋</strong>
            Frag mich, wo du etwas auf {siteName} findest. Ich zeige es dir direkt auf der Seite.
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'continuation') {
            return null; // internal auto-step — not shown to user
          }
          return (
            <div key={i} class={`msg ${m.role}`}>
              {m.content}
              {m.streaming && <span class="cursor" />}
            </div>
          );
        })}

        {advisorActive && (
          <div class="advisor-badge">
            <span class="dot" />
            Opus advisor denkt nach…
          </div>
        )}
      </div>

      <div class="footer">
        <div class="input-row">
          <textarea
            class="input"
            placeholder="Type here..."
            value={input}
            onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            class="send-btn"
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div class="powered">powered by AI Buddy</div>
      </div>
    </div>
  );
}
