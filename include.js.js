// 全域 Theme 控制
function applyLogoTheme(theme) {
    const isDark = theme === 'dark';
    const thBtn = document.getElementById('theme-btn');
    if (thBtn) thBtn.textContent = isDark ? '🌙 深色' : '☀️ 淺色';
}

function toggleTheme() {
    const h = document.documentElement;
    const isDark = h.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    h.setAttribute('data-theme', next);
    applyLogoTheme(next);
    localStorage.setItem('bin-theme', next);
}

function initTheme() {
    let theme = localStorage.getItem('bin-theme');
    if (!theme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = 'dark';
        } else {
            theme = 'light';
        }
    }
    document.documentElement.setAttribute('data-theme', theme);
    applyLogoTheme(theme);
}

// 全域 Modal 控制
window.openModal = function(id) { 
    const el = document.getElementById(id);
    if(el) el.classList.add('open'); 
};
window.closeModal = function(id) { 
    const el = document.getElementById(id);
    if(el) el.classList.remove('open'); 
};

// 載入共用元件
async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const html = await response.text();
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = html;

        // 重新執行透過 fetch 載入的 <script> (例如 AdSense)
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
    }
}

// 頁面初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // 監聽系統外觀設定變化
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('bin-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                applyLogoTheme(newTheme);
            }
        });
    }
    
    Promise.all([
        loadComponent('/components/header.html', 'header'),
        loadComponent('/components/footer.html', 'footer')
    ]).then(() => {
        // 更新按鈕狀態
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        applyLogoTheme(theme);

        // 綁定 Modal 點擊背景關閉
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('open');
            });
        });

        // 判斷是否為首頁，首頁需隱藏上方工具列的 Tabs
        const isIndex = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
        if (isIndex) {
            const toolTabs = document.getElementById('tool-tabs');
            const hamburger = document.getElementById('hamburger-btn');
            if (toolTabs) toolTabs.style.display = 'none';
            if (hamburger) hamburger.style.display = 'none';
        } else {
            // 如果是在 Tools 頁面，且網址帶有 Hash (#excel)，則切換到該工具
            if (window.switchTool) {
                const hash = window.location.hash.replace('#', '');
                if (hash) switchTool(hash);
            }
        }
    });
});