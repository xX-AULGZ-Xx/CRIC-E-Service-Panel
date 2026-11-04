(function () {
  'use strict';

  // Determine portal origin from script tag or fallback
  let portalUrl = 'https://panel.cric.ac.th';

  if (window.__CRIC_PORTAL_URL__) {
    portalUrl = window.__CRIC_PORTAL_URL__.replace(/\/$/, '');
  } else {
    let foundSrc = document.currentScript ? document.currentScript.src : null;

    if (!foundSrc) {
      const scriptTag = document.querySelector('script[src*="launcher.js"]');
      if (scriptTag && scriptTag.src) {
        foundSrc = scriptTag.src;
      }
    }

    if (foundSrc) {
      try {
        portalUrl = new URL(foundSrc).origin;
      } catch (e) {
        portalUrl = 'https://panel.cric.ac.th';
      }
    } else if (typeof window !== 'undefined' && window.location.hostname.includes('cric.ac.th')) {
      portalUrl = 'https://panel.cric.ac.th';
    } else if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      portalUrl = 'http://localhost:3000';
    }
  }

  const PORTAL_URL = portalUrl;

  // Prevent multiple injections
  if (window.__CRIC_LAUNCHER_LOADED__) return;
  window.__CRIC_LAUNCHER_LOADED__ = true;

  const style = document.createElement('style');
  style.textContent = `
    .cric-widget-root {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      /* Default tokens: Clean Light Theme */
      --cric-bg: rgba(255, 255, 255, 0.98);
      --cric-border: #e2e8f0;
      --cric-header-border: #f1f5f9;
      --cric-text-title: #0f172a;
      --cric-text-body: #334155;
      --cric-text-sub: #64748b;
      --cric-hover: #f1f5f9;
      --cric-footer-bg: #f8fafc;
      --cric-footer-border: #e2e8f0;
      --cric-link: #2563eb;
      --cric-btn-bg: #ffffff;
      --cric-btn-border: #e2e8f0;
      --cric-btn-color: #475569;
      --cric-btn-hover-bg: #f1f5f9;
      --cric-btn-hover-color: #0f172a;
      --cric-btn-active-border: #3b82f6;
      --cric-btn-active-color: #2563eb;
      --cric-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    /* Dark Theme override: ONLY applied when host is explicitly dark */
    .cric-widget-root.cric-theme-dark {
      --cric-bg: #1e1f20;
      --cric-border: #3c4043;
      --cric-header-border: rgba(60, 64, 67, 0.6);
      --cric-text-title: #f1f3f4;
      --cric-text-body: #e8eaed;
      --cric-text-sub: #9aa0a6;
      --cric-hover: #2d2e31;
      --cric-footer-bg: #18191a;
      --cric-footer-border: #3c4043;
      --cric-link: #8ab4f8;
      --cric-btn-bg: #1e1f20;
      --cric-btn-border: #3c4043;
      --cric-btn-color: #e3e3e3;
      --cric-btn-hover-bg: #2d2e31;
      --cric-btn-hover-color: #ffffff;
      --cric-btn-active-border: #8ab4f8;
      --cric-btn-active-color: #8ab4f8;
      --cric-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
    }
    .cric-widget-root.cric-widget-inline {
      position: relative;
      top: auto;
      right: auto;
      z-index: 45;
      display: inline-flex;
      align-items: center;
    }
    .cric-widget-root.cric-widget-inline .cric-widget-btn {
      width: 36px;
      height: 36px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .cric-widget-root.cric-widget-inline .cric-widget-popover {
      top: calc(100% + 8px);
      right: 0;
    }
    .cric-widget-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--cric-btn-bg, #ffffff);
      border: 1px solid var(--cric-btn-border, #e2e8f0);
      color: var(--cric-btn-color, #475569);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
      outline: none;
    }
    .cric-widget-btn:hover {
      background: var(--cric-btn-hover-bg, #f1f5f9);
      color: var(--cric-btn-hover-color, #0f172a);
      transform: scale(1.05);
    }
    .cric-widget-btn.active {
      background: var(--cric-btn-hover-bg, #f1f5f9);
      border-color: var(--cric-btn-active-border, #3b82f6);
      color: var(--cric-btn-active-color, #2563eb);
    }
    .cric-widget-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .cric-widget-popover {
      position: absolute;
      top: 50px;
      right: 0;
      width: 340px;
      max-width: calc(100vw - 28px);
      max-height: min(520px, 80vh);
      background: var(--cric-bg, #ffffff) !important;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--cric-border, #e2e8f0) !important;
      border-radius: 24px;
      box-shadow: var(--cric-shadow, 0 16px 40px rgba(0,0,0,0.1)) !important;
      color: var(--cric-text-body, #334155) !important;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: cric-scale-in 0.15s ease-out;
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .cric-widget-popover.open {
      display: flex;
    }
    @keyframes cric-scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .cric-widget-header {
      padding: 14px 18px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--cric-header-border, #f1f5f9) !important;
    }
    .cric-widget-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--cric-text-title, #0f172a) !important;
    }
    .cric-widget-body {
      padding: 12px;
      overflow-y: auto;
      max-height: 400px;
    }
    .cric-widget-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .cric-widget-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      padding: 10px 4px;
      border-radius: 16px;
      transition: background 0.15s ease, transform 0.15s ease;
      color: var(--cric-text-body, #334155) !important;
      text-align: center;
    }
    .cric-widget-item:hover {
      background: var(--cric-hover, #f1f5f9);
      transform: translateY(-1px);
    }
    .cric-widget-item img {
      width: 38px;
      height: 38px;
      object-fit: contain;
      margin-bottom: 6px;
      border-radius: 8px;
    }
    .cric-widget-item span {
      font-size: 11px;
      font-weight: 500;
      color: var(--cric-text-body, #334155) !important;
      max-width: 80px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cric-widget-footer {
      padding: 10px 16px;
      background: var(--cric-footer-bg, #f8fafc) !important;
      border-top: 1px solid var(--cric-footer-border, #e2e8f0) !important;
      font-size: 11px;
      color: var(--cric-text-sub, #64748b) !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cric-widget-footer a {
      color: var(--cric-link, #2563eb) !important;
      font-weight: 500;
      text-decoration: none;
    }
    .cric-widget-footer a:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);

  // Create UI Elements
  const root = document.createElement('div');
  root.className = 'cric-widget-root';

  // Adaptive Real-Time Theming System
  function detectHostTheme() {
    const docEl = document.documentElement;
    const body = document.body;

    // 1. Check parent container attribute (e.g. data-cric-theme="light|dark")
    const targetContainer = document.getElementById('cric-launcher-container') || document.querySelector('[data-cric-launcher]') || root.parentElement;
    if (targetContainer) {
      const containerTheme = targetContainer.getAttribute('data-cric-theme') || targetContainer.getAttribute('data-theme');
      if (containerTheme === 'dark' || containerTheme === 'light') return containerTheme;
    }

    // 2. Check documentElement or body classes/attributes
    const isDark =
      docEl.classList.contains('dark') ||
      (body && body.classList.contains('dark')) ||
      docEl.getAttribute('data-theme') === 'dark' ||
      (body && body.getAttribute('data-theme') === 'dark') ||
      docEl.getAttribute('data-color-mode') === 'dark';

    if (isDark) return 'dark';

    const isLight =
      docEl.classList.contains('light') ||
      (body && body.classList.contains('light')) ||
      docEl.getAttribute('data-theme') === 'light' ||
      (body && body.getAttribute('data-theme') === 'light') ||
      docEl.getAttribute('data-color-mode') === 'light';

    if (isLight) return 'light';

    // 3. Smart Background Luminance Detection (inspects actual rendered navbar/header/body color)
    try {
      let cur = targetContainer || root.parentElement;
      while (cur && cur !== document.documentElement) {
        const bg = window.getComputedStyle(cur).backgroundColor;
        if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
          const m = bg.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/);
          if (m) {
            const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
            if (a > 0.1) {
              const lum = 0.299 * parseInt(m[1], 10) + 0.587 * parseInt(m[2], 10) + 0.114 * parseInt(m[3], 10);
              return lum < 128 ? 'dark' : 'light';
            }
          }
        }
        cur = cur.parentElement;
      }
      if (body) {
        const bodyBg = window.getComputedStyle(body).backgroundColor;
        if (bodyBg && bodyBg !== 'transparent' && !bodyBg.startsWith('rgba(0, 0, 0, 0)')) {
          const m = bodyBg.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/);
          if (m) {
            const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
            if (a > 0.1) {
              const lum = 0.299 * parseInt(m[1], 10) + 0.587 * parseInt(m[2], 10) + 0.114 * parseInt(m[3], 10);
              return lum < 128 ? 'dark' : 'light';
            }
          }
        }
      }
    } catch (e) {}

    return 'light';
  }

  function applyTheme() {
    const theme = detectHostTheme();
    root.classList.remove('cric-theme-light', 'cric-theme-dark');
    root.classList.add(theme === 'dark' ? 'cric-theme-dark' : 'cric-theme-light');
  }

  // Initial theme application
  applyTheme();

  // Real-time MutationObserver to watch theme changes on html or body
  try {
    const observer = new MutationObserver(() => {
      applyTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-mode'] });
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-mode'] });
    }
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    }
  } catch (e) {}

  const btn = document.createElement('button');
  btn.className = 'cric-widget-btn';
  btn.title = 'CRIC E-Service Launcher';
  btn.setAttribute('aria-label', 'CRIC E-Service Launcher');
  // 9-dots SVG (3x3 grid)
  btn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <circle cx="5" cy="5" r="2"></circle>
      <circle cx="12" cy="5" r="2"></circle>
      <circle cx="19" cy="5" r="2"></circle>
      <circle cx="5" cy="12" r="2"></circle>
      <circle cx="12" cy="12" r="2"></circle>
      <circle cx="19" cy="12" r="2"></circle>
      <circle cx="5" cy="19" r="2"></circle>
      <circle cx="12" cy="19" r="2"></circle>
      <circle cx="19" cy="19" r="2"></circle>
    </svg>
  `;

  const popover = document.createElement('div');
  popover.className = 'cric-widget-popover';
  popover.innerHTML = `
    <div class="cric-widget-header">
      <h4>Your favorites</h4>
    </div>
    <div class="cric-widget-body">
      <div class="cric-widget-grid" id="cric-widget-grid">
        <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #9aa0a6;">
          กำลังโหลดบริการ...
        </div>
      </div>
    </div>
    <div class="cric-widget-footer">
      <span>CRIC E-Services</span>
      <a href="${PORTAL_URL}" target="_blank">เปิดหน้า Portal ↗</a>
    </div>
  `;

  root.appendChild(btn);
  root.appendChild(popover);

  function mountWidget() {
    const targetContainer = document.getElementById('cric-launcher-container') || document.querySelector('[data-cric-launcher]');
    if (targetContainer) {
      root.classList.add('cric-widget-inline');
      targetContainer.appendChild(root);
      applyTheme();
      return true;
    }
    return false;
  }

  // Mount into targeted container if available, or fallback to body
  if (!mountWidget()) {
    let mountAttempts = 0;
    const mountInterval = setInterval(() => {
      mountAttempts++;
      if (mountWidget() || mountAttempts >= 30) {
        clearInterval(mountInterval);
        if (!root.parentNode) {
          document.body.appendChild(root);
        }
      }
    }, 100);
  }

  let isOpen = false;
  let servicesLoaded = false;
  const SERVICES_CACHE_TTL = 60 * 1000; // 60s SWR window

  function detectCurrentRole() {
    try {
      // 1. Check cric_active_role cookie
      const roleMatch = document.cookie.match(/(?:^|;\s*)cric_active_role=([^;]+)/);
      if (roleMatch && roleMatch[1]) {
        return decodeURIComponent(roleMatch[1]);
      }

      // 2. Check cric_user_profile cookie
      const profileMatch = document.cookie.match(/(?:^|;\s*)cric_user_profile=([^;]+)/);
      if (profileMatch && profileMatch[1]) {
        const parsed = JSON.parse(decodeURIComponent(profileMatch[1]));
        if (parsed.currentRole) return parsed.currentRole;
        if (parsed.role) return parsed.role;
      }

      // 3. Check local storage of subsystem (Plan: vps_user, RCMS: user)
      const vpsUserStr = localStorage.getItem('vps_user');
      if (vpsUserStr) {
        const u = JSON.parse(vpsUserStr);
        if (u.role) return u.role;
      }

      const rcmsUserStr = localStorage.getItem('user');
      if (rcmsUserStr) {
        const u = JSON.parse(rcmsUserStr);
        if (u.role) return u.role;
      }

      // 4. Check central login cookie
      const isLoggedIn = document.cookie.includes('cric_logged_in=true');
      if (!isLoggedIn) {
        return 'guest';
      }
    } catch (e) {}

    return 'guest';
  }

  function getServicesCacheKey() {
    const role = detectCurrentRole();
    return `cric_services_cache_${role}`;
  }

  function clearAllServicesCache() {
    try {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('cric_services_cache_') || k === 'cric_services_cache') {
          sessionStorage.removeItem(k);
        }
      }
    } catch (e) {}
  }

  function renderServicesHtml(services) {
    if (!Array.isArray(services) || services.length === 0) {
      return `
        <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #9aa0a6;">
          ยังไม่มีบริการในระบบ
        </div>
      `;
    }
    return services
      .map(
        (srv) => `
        <a href="${srv.url}" target="${srv.openInNewTab ? '_blank' : '_self'}" class="cric-widget-item" title="${srv.title}">
          <img src="${srv.iconUrl && srv.iconUrl.startsWith('/') ? PORTAL_URL + srv.iconUrl : (srv.iconUrl || '')}" alt="" onerror="this.style.display='none'; if(this.parentElement && !this.parentElement.querySelector('span.fallback-icon')) { const fb = document.createElement('span'); fb.className='fallback-icon'; fb.style.fontSize='24px'; fb.style.display='block'; fb.innerHTML='🌐'; this.parentElement.insertBefore(fb, this); }" />
          <span>${srv.title}</span>
        </a>
      `
      )
      .join('');
  }

  function getCachedServices() {
    try {
      const key = getServicesCacheKey();
      const cached = sessionStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return null;
  }

  function setCachedServices(data) {
    try {
      const key = getServicesCacheKey();
      sessionStorage.setItem(
        key,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (e) {}
  }

  async function loadServices(forceRefresh = false) {
    const grid = document.getElementById('cric-widget-grid');
    if (!grid) return;

    const currentRole = detectCurrentRole();

    // Fast-path: Render from cache instantly (0ms)
    const cached = getCachedServices();
    const isCacheFresh = cached && (Date.now() - cached.timestamp < SERVICES_CACHE_TTL);

    if (cached && Array.isArray(cached.data)) {
      grid.innerHTML = renderServicesHtml(cached.data);
      servicesLoaded = true;
      if (isCacheFresh && !forceRefresh) {
        return; // Cache is fresh, avoid background request
      }
    }

    try {
      // Fetch CRIC Services with credentials and current role to enforce RBAC
      const url = `${PORTAL_URL}/api/v1/services?launcher=true&role=${encodeURIComponent(currentRole)}`;
      const res = await fetch(url, {
        mode: 'cors',
        credentials: 'include',
      });
      const data = await res.json();
      if (!grid) return;

      if (data.success && Array.isArray(data.data)) {
        setCachedServices(data.data);
        grid.innerHTML = renderServicesHtml(data.data);
        servicesLoaded = true;
      } else if (!cached) {
        grid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #9aa0a6;">
            ยังไม่มีบริการในระบบ
          </div>
        `;
      }
    } catch (e) {
      console.error('[CRIC Widget] Failed to load services from', `${PORTAL_URL}/api/v1/services`, e);
      if (!cached) {
        grid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 18px 0; font-size: 12px; color: #f87171;">
            <div>ไม่สามารถเชื่อมต่อกับ Portal ได้</div>
            <button id="cric-widget-retry" style="margin-top: 8px; padding: 4px 10px; font-size: 11px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer;">
              กดเพื่อลองใหม่
            </button>
          </div>
        `;
        const retryBtn = document.getElementById('cric-widget-retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            grid.innerHTML = `
              <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #9aa0a6;">
                กำลังโหลดบริการ...
              </div>
            `;
            loadServices(true);
          });
        }
      }
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    applyTheme();
    isOpen = !isOpen;
    btn.classList.toggle('active', isOpen);
    popover.classList.toggle('open', isOpen);

    if (isOpen) {
      loadServices();
    }
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      isOpen = false;
      btn.classList.remove('active');
      popover.classList.remove('open');
    }
  });

  // ==========================================
  // UNIVERSAL SSO AGENT (Auto-Login & Auto-Logout)
  // ==========================================
  function initUniversalSsoAgent() {
    let isSyncing = false;

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }

    function isTokenValid(token) {
      if (!token || typeof token !== 'string') return false;
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    async function checkAndSyncSession() {
      if (isSyncing) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const isCricDomain = window.location.hostname.includes('cric.ac.th');
      const pathname = window.location.pathname;

      // Skip public routes
      if (
        pathname.startsWith('/install') ||
        pathname.startsWith('/surveys/') ||
        pathname.startsWith('/events/') ||
        pathname === '/auth/callback'
      ) {
        return;
      }

      const localToken = localStorage.getItem('token');
      const hasCricCookie = document.cookie.split(';').some((c) => c.trim().startsWith('cric_logged_in=true'));
      let ssoSessionCookie = getCookie('cric_sso_session');

      if (ssoSessionCookie && !isTokenValid(ssoSessionCookie)) {
        ssoSessionCookie = null;
      }

      // CASE A: User is logged in to local app, but logged out of Central Portal
      if (isCricDomain && localToken && !hasCricCookie) {
        console.warn('[CRIC SSO Agent] Central session logged out. Purging local credentials...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('cric:sso:logout'));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: null }));

        if (pathname.startsWith('/dashboard')) {
          window.location.href = window.location.origin + '/login?expired=1';
        }
        return;
      }

      // CASE B: User is NOT logged in to local app, but is logged in to Central Portal (AUTO-LOGIN!)
      if (!localToken && (ssoSessionCookie || isCricDomain)) {
        let sessionToken = ssoSessionCookie;

        // If no direct cookie, verify with Central Session Check API
        if (!sessionToken) {
          try {
            const checkRes = await fetch(`${PORTAL_URL}/api/v1/sso/session-check`, {
              mode: 'cors',
              credentials: 'include',
            });
            const checkData = await checkRes.json();
            if (checkData.authenticated && checkData.ssoToken && isTokenValid(checkData.ssoToken)) {
              sessionToken = checkData.ssoToken;
            }
          } catch (e) {
            // ignore network check error
          }
        }

        if (sessionToken) {
          isSyncing = true;
          console.log('[CRIC SSO Agent] Active Portal session detected! Executing Auto-Login...');

          try {
            // Sync with local application auth endpoint (e.g. RCMS /api/v1/auth/sso/sync-session)
            const syncEndpoint = window.__CRIC_SSO_SYNC_ENDPOINT__ || '/api/v1/auth/sso/sync-session';
            const res = await fetch(syncEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionToken }),
            });
            const data = await res.json();

            if (data.success && data.data?.token) {
              localStorage.setItem('token', data.data.token);
              localStorage.setItem('user', JSON.stringify(data.data.user));

              console.log('[CRIC SSO Agent] Auto-Login successful! User:', data.data.user?.username || data.data.user?.email);

              // Notify Navbar and application components in-place
              window.dispatchEvent(new CustomEvent('cric:sso:login', { detail: data.data.user }));
              window.dispatchEvent(new CustomEvent('user-updated', { detail: data.data.user }));

              // If currently waiting on /login, forward to /dashboard
              if (pathname === '/login') {
                window.location.href = '/dashboard';
              }
            }
          } catch (err) {
            console.warn('[CRIC SSO Agent] Auto-login sync attempt error:', err);
          } finally {
            isSyncing = false;
          }
        }
      }
    }

    // Initial check
    checkAndSyncSession();

    // Event-driven triggers: tab focus & visibility change
    window.addEventListener('focus', checkAndSyncSession);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndSyncSession();
      }
    });

    // Smart 4-second heartbeat (only active when tab is visible)
    setInterval(() => {
      if (!document.hidden) {
        checkAndSyncSession();
      }
    }, 4000);

    // Expose global controller
    window.CricSSO = {
      checkSession: checkAndSyncSession,
      getPortalUrl: () => PORTAL_URL,
    };
  }

  // Clear services cache on authentication/session events so 9-dot refreshes immediately
  window.addEventListener('cric:sso:login', () => {
    servicesLoaded = false;
    clearAllServicesCache();
  });
  window.addEventListener('cric:sso:logout', () => {
    servicesLoaded = false;
    clearAllServicesCache();
  });
  window.addEventListener('user-updated', () => {
    servicesLoaded = false;
    clearAllServicesCache();
  });

  // Initialize SSO Agent automatically
  initUniversalSsoAgent();
})();
