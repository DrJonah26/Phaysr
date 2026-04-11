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
      left: 18px;
      bottom: 18px;
      z-index: 2147483647;
      font-size: 12px;
      color: #13151d;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .input-dock {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      width: min(420px, calc(100vw - 32px));
      min-height: 40px;
      padding: 6px 8px 6px 10px;
      border-radius: 12px;
      border: 1px solid rgba(15, 18, 24, 0.14);
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.16);
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
      font-family: inherit;
    }
    .dock-input::placeholder {
      color: #7a8091;
    }
    .dock-send {
      border: none;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background: ${color};
      cursor: pointer;
      transition: transform 0.12s ease, opacity 0.12s ease;
    }
    .dock-send:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .dock-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .dock-hint {
      margin-left: 6px;
      color: rgba(19, 21, 29, 0.68);
      font-size: 11px;
      line-height: 1.2;
      user-select: none;
    }

    @media (max-width: 560px) {
      .root {
        left: 10px;
        right: 10px;
        bottom: 10px;
      }
      .input-dock {
        width: calc(100vw - 20px);
      }
      .dock-hint {
        max-width: calc(100vw - 20px);
      }
    }
  `;
}
