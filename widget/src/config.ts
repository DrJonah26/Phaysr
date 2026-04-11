export interface WidgetConfig {
  apiKey: string;
  siteName: string;
  color: string;
  backendUrl: string;
  context: string; // extra knowledge injected into system prompt (FAQ, docs, etc.)
}

const DEFAULTS: WidgetConfig = {
  apiKey: '',
  siteName: 'this site',
  color: '#3B82F6',
  backendUrl: 'http://localhost:3000',
  context: '',
};

export function readConfigFromScriptTag(): WidgetConfig {
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[data-widget="ai-buddy"]') ??
    document.querySelector<HTMLScriptElement>('script[src*="widget.js"]');

  if (!script) return { ...DEFAULTS };

  return {
    apiKey: script.getAttribute('data-api-key') ?? DEFAULTS.apiKey,
    siteName: script.getAttribute('data-site-name') ?? DEFAULTS.siteName,
    color: script.getAttribute('data-color') ?? DEFAULTS.color,
    backendUrl: script.getAttribute('data-backend-url') ?? DEFAULTS.backendUrl,
    context: script.getAttribute('data-context') ?? DEFAULTS.context,
  };
}
