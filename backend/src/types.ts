export interface DOMElementSnapshot {
  tag: string;
  text?: string;
  selector: string;
  ariaLabel?: string | null;
  role?: string | null;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface InputValueSnapshot {
  selector: string;
  value: string;
  placeholder: string | null;
  type: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  question: string;
  screenshot_base64: string;
  dom_snapshot: DOMElementSnapshot[];
  current_url: string;
  page_title: string;
  conversation_history: ChatMessage[];
  site_name?: string;
  api_key?: string;
  site_context?: string; // optional FAQ / docs injected by the SaaS customer
  input_values?: InputValueSnapshot[];
}
