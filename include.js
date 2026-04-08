/**
 * include.js — BinTools 共用元件載入器
 * 支援 GitHub Pages（含 project pages 子路徑）與本地端開發
 *
 * 使用方式：
 *   <div id="site-header"></div>
 *   <div id="site-footer"></div>
 *   <script src="js/include.js" data-page="index"></script>
 *
 * data-page 可為：index | tools
 */
(function () {
  /* ── 1. 計算 base 路徑（相對於目前頁面） ─────────────────── */
  const scriptEl = document.currentScript;
  const page     = scriptEl ? scriptEl.getAttribute('data-page') : '';

  // 取得 components/ 相對路徑
  // 所有頁面都放在根目錄，所以 components/ 與 js/ 都是同一層
  const base = scriptEl
    ? scriptEl.src.replace(/js\/include\.js.*$/, '')
    : (function () {
        const a = document.createElement('a');
        a.href = 'components/';
        return a.href.replace(/components\/$/, '');
      })();

  /* ── 2. fetch 並注入 HTML ─────────────────────────────────── */
  function loadComponent(url, targetId, onDone) {
    const el = document.getElementById(targetId);
    if (!el) return;

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
        return r.text();
      })
      .then(function (html) {
        // 將 __BASE__ 取代為實際路徑（讓 header/footer 內的連結正確）
        html = html.replace(/__BASE__/g, base);
        el.innerHTML = html;
        if (typeof onDone === 'function') onDone();
      })
      .catch(function (err) {
        console.warn('[include.js] 載入失敗：', err);
      });
  }

  /* ── 3. 主題初始化（在 header 注入後執行） ───────────────── */
  function initTheme() {
    const saved = localStorage.getItem('bin-theme');
    let theme = saved;
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = theme === 'dark' ? '🌙 深色' : '☀️ 淺色';
  }

  /* ── 4. tools.html 專用：啟用 tab 列與 hash 切換 ─────────── */
  function initToolsTabs() {
    const toolTabs   = document.getElementById('tool-tabs');
    const mobileMenu = document.getElementById('mobile-menu');
    if (toolTabs)   toolTabs.style.display   = '';
    if (mobileMenu) mobileMenu.style.display = '';

    // 根據目前 hash 設定 active tab
    function setActiveTab() {
      const hash = location.hash.replace('#', '') || 'excel';
      document.querySelectorAll('.tool-tab').forEach(function (t) {
        t.classList.toggle('active', t.id === 'tab-' + hash);
      });
    }
    setActiveTab();
    window.addEventListener('hashchange', setActiveTab);
  }

  /* ── 5. tools.html 專用：lang dropdown ───────────────────── */
  function initLangDropdown() {
    const wrap = document.getElementById('header-lang-dropdown');
    if (!wrap) return;
    wrap.style.display = '';

    // lang-menu 內容由 tools.html 自行 render（沿用原邏輯）
    // 這裡只負責顯示 dropdown 容器
  }

  /* ── 6. 全域 toggleTheme（header 載入後才能用） ──────────── */
  window.toggleTheme = function () {
    const html   = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next   = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = next === 'dark' ? '🌙 深色' : '☀️ 淺色';
    localStorage.setItem('bin-theme', next);
    // 若 tools.html 有自己的 applyLogoTheme，呼叫它
    if (typeof applyLogoTheme === 'function') applyLogoTheme(next);
  };

  /* ── 7. 全域 toggleMobileMenu ────────────────────────────── */
  window.toggleMobileMenu = function () {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('open');
  };

  /* ── 8. 關閉 lang dropdown（點外部） ─────────────────────── */
  document.addEventListener('click', function (e) {
    const dd = document.getElementById('lang-menu');
    if (dd && !e.target.closest('.lang-dropdown')) dd.classList.remove('open');
  });

  window.toggleLangMenu = function () {
    const dd = document.getElementById('lang-menu');
    if (dd) dd.classList.toggle('open');
  };

  /* ── 9. 載入 header → footer ─────────────────────────────── */
  loadComponent(base + 'components/header.html', 'site-header', function () {
    initTheme();
    if (page === 'tools') {
      initToolsTabs();
      initLangDropdown();
    }
  });

  loadComponent(base + 'components/footer.html', 'site-footer');

})();
