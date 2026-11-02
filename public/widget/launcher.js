(function () {
  'use strict';

  // Determine portal origin from script tag
  const currentScript = document.currentScript;
  const scriptUrl = currentScript ? new URL(currentScript.src) : new URL('http://localhost:3000');
  const PORTAL_URL = scriptUrl.origin;

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
    }
    .cric-widget-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1e1f20;
      border: 1px solid #3c4043;
      color: #e3e3e3;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      outline: none;
    }
    .cric-widget-btn:hover {
      background: #2d2e31;
      color: #ffffff;
      transform: scale(1.05);
    }
    .cric-widget-btn.active {
      background: #2d2e31;
      border-color: #8ab4f8;
      color: #8ab4f8;
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
      max-height: 520px;
      background: #1e1f20;
      border: 1px solid #3c4043;
      border-radius: 24px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.65);
      color: #ffffff;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: cric-scale-in 0.15s ease-out;
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
      border-bottom: 1px solid rgba(60,64,67,0.5);
    }
    .cric-widget-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
      color: #f1f3f4;
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
      transition: background 0.15s ease;
      color: #e8eaed;
      text-align: center;
    }
    .cric-widget-item:hover {
      background: #2d2e31;
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
      color: #e8eaed;
      max-width: 80px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cric-widget-footer {
      padding: 10px 16px;
      background: #18191a;
      border-top: 1px solid #3c4043;
      font-size: 11px;
      color: #9aa0a6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cric-widget-footer a {
      color: #8ab4f8;
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
  document.body.appendChild(root);

  let isOpen = false;
  let servicesLoaded = false;

  async function loadServices() {
    try {
      const res = await fetch(`${PORTAL_URL}/api/v1/services`, {
        mode: 'cors',
        credentials: 'include',
      });
      const data = await res.json();
      const grid = document.getElementById('cric-widget-grid');
      if (!grid) return;

      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #9aa0a6;">
            ยังไม่มีบริการในระบบ
          </div>
        `;
        return;
      }

      grid.innerHTML = data.data
        .map(
          (srv) => `
          <a href="${srv.url}" target="${srv.openInNewTab ? '_blank' : '_self'}" class="cric-widget-item" title="${srv.title}">
            <img src="${srv.iconUrl && srv.iconUrl.startsWith('/') ? PORTAL_URL + srv.iconUrl : (srv.iconUrl || '')}" alt="${srv.title}" />
            <span>${srv.title}</span>
          </a>
        `
        )
        .join('');
      servicesLoaded = true;
    } catch (e) {
      console.error('Failed to load CRIC services in widget', e);
      const grid = document.getElementById('cric-widget-grid');
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 20px 0; font-size: 12px; color: #f87171;">
            ไม่สามารถเชื่อมต่อกับ Portal ได้
          </div>
        `;
      }
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    btn.classList.toggle('active', isOpen);
    popover.classList.toggle('open', isOpen);

    if (isOpen && !servicesLoaded) {
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
})();
