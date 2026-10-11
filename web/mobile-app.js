/* ProTrader Android integration: runs only within a native Capacitor WebView. */
(() => {
  'use strict';
  const isNative = Boolean(window.Capacitor?.isNativePlatform?.()) ||
    ((location.protocol === 'https:' || location.protocol === 'http:') && location.hostname === 'localhost' && !location.port);
  window.ProTraderMobile = Object.freeze({ isNative });
  if (!isNative) return;

  const apiHealthUrl = 'https://protrader-backend-n8oj.onrender.com/api/health';
  let checking = false;
  let lastOnline = false;
  let overlay;
  let statusText;
  let retryButton;
  let lastCheckAt = 0;

  const show = (message, isError) => {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    statusText.textContent = message;
    retryButton.hidden = !isError;
    document.body.classList.add('protrade-android-connection-required');
  };
  const hide = () => {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('protrade-android-connection-required');
  };

  async function checkConnection() {
    if (checking) return;
    checking = true;
    lastCheckAt = Date.now();
    if (!lastOnline) show('Connecting securely to your ProTrader server…', false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      if (navigator.onLine === false) throw new Error('Offline');
      const res = await fetch(apiHealthUrl, { method: 'GET', cache: 'no-store', signal: controller.signal });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const body = await res.json();
      if (body?.server !== 'running' || body?.database !== 'connected') {
        throw new Error('Server not ready');
      }
      lastOnline = true;
      hide();
    } catch (error) {
      lastOnline = false;
      console.warn('ProTrader mobile connection unavailable:', error.message);
      show('Internet or ProTrader server unavailable. Connect to the internet and try again. Your trades will not be shown as synced until the server responds.', true);
    } finally {
      clearTimeout(timeout);
      checking = false;
    }
  }

  function init() {
    overlay = document.createElement('div');
    overlay.id = 'protrader-mobile-network-gate';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <section class="pm-connect-card">
        <div class="pm-app-mark">P<span>.</span></div>
        <div class="pm-app-eyebrow">PROTRADER • ONLINE APP</div>
        <h1>Connecting to ProTrader</h1>
        <p id="pm-connection-status" role="status">Checking secure connection…</p>
        <button type="button" id="pm-connection-retry" hidden>Retry connection</button>
        <small>Existing accounts and trade records stay on your online backend.</small>
      </section>`;
    statusText = overlay.querySelector('#pm-connection-status');
    retryButton = overlay.querySelector('#pm-connection-retry');
    retryButton.addEventListener('click', checkConnection);
    document.body.appendChild(overlay);
    show('Connecting securely to your ProTrader server…', false);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', () => {
      lastOnline = false;
      show('No internet connection. Reconnect to access your trading workspace.', true);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - lastCheckAt > 15000) checkConnection();
    });
    setInterval(() => {
      if (!document.hidden && (!lastOnline || Date.now() - lastCheckAt > 60000)) checkConnection();
    }, 15000);
    checkConnection();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
