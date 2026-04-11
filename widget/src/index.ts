import { render, h } from 'preact';
import { App } from './ui/app.js';
import { readConfigFromScriptTag } from './config.js';
import { getWidgetStyles } from './ui/styles.js';

const HOST_ID = '__web_widget_host__';

function init() {
  if (document.getElementById(HOST_ID)) return;

  const config = readConfigFromScriptTag();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = getWidgetStyles(config.color);
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  render(h(App, { config, hostElement: host }), mountPoint);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
