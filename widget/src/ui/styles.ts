export function getWidgetStyles(color: string): string {
  return `
    :host {
      all: initial;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    .root {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      font-size: 12px;
      color: #13151d;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .input-dock {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      width: min(420px, calc(100vw - 32px));
      min-height: 40px;
      padding: 5px 6px 5px 12px;
      border-radius: 10px;
      border: 3px solid ${color};
      background: #D9D9D9;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    .dock-input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      color: #0f1118;
      font-size: 13px;
      line-height: 1.3;
      padding: 2px 0;
      outline: none;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    .dock-input::placeholder {
      color: #888899;
    }
    .dock-send {
      border: none;
      border-radius: 6px;
      padding: 5px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      background: transparent;
      cursor: pointer;
      transition: transform 0.12s ease, opacity 0.12s ease;
      flex-shrink: 0;
    }
    .dock-send:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .dock-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    @media (max-width: 560px) {
      .root {
        right: 10px;
        bottom: 10px;
      }
      .input-dock {
        width: calc(100vw - 20px);
      }
    }
  `;
}
