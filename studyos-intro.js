(() => {
  const seenKey = 'studyos-intro-seen';
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'reload' || navigation?.type === 'back_forward') return;
  try {
    if (sessionStorage.getItem(seenKey)) return;
  } catch {
    // Reload and back/forward still skip the intro when storage is unavailable.
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !document.body) return;

  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.id = 'studyos-intro';
  dialog.setAttribute('aria-label', 'StudyOS 開場動畫');
  dialog.innerHTML = `
    <div class="intro-veil" aria-hidden="true"></div>
    <div class="intro-stage" aria-hidden="true">
      ${Array.from({length: 5}, () => '<div class="intro-card"><span></span></div>').join('')}
    </div>
    <button type="button" id="studyos-intro-skip" autofocus>跳過動畫</button>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #studyos-intro {
      position: fixed; inset: 0; width: auto; height: auto; max-width: none; max-height: none;
      margin: 0; padding: 0; border: 0; border-radius: 0; box-shadow: none;
      background: transparent; overflow: hidden; overscroll-behavior: contain;
    }
    #studyos-intro::backdrop { background: transparent; }
    #studyos-intro .intro-veil { position: absolute; inset: 0; background: var(--bg); }
    #studyos-intro .intro-stage {
      position: absolute; top: 50%; left: 50%; width: clamp(74px, 18vmin, 112px);
      aspect-ratio: 38 / 51; transform: translate(-50%, -50%);
    }
    #studyos-intro .intro-card {
      position: absolute; inset: 0; padding: 12%; border: 1px solid var(--border-strong);
      border-radius: 12%; background: var(--surface);
      background: color-mix(in srgb, var(--surface), var(--text-2) var(--tint));
      box-shadow: 0 3px 12px rgba(0, 0, 0, .12);
      transform-origin: 50% 118.63%;
    }
    #studyos-intro .intro-card span {
      display: block; height: 54%; border-radius: 14%; background: var(--selection-bg, var(--sunken-h));
      background: color-mix(in srgb, var(--sunken-h), var(--text-2) 17%);
    }
    #studyos-intro .intro-card::before, #studyos-intro .intro-card::after {
      content: ''; position: absolute; left: 12%; top: 64%; width: 51%; height: 4%;
      border-radius: 999px; background: var(--text-2); opacity: .5;
    }
    #studyos-intro .intro-card::after { top: 77%; width: 37%; opacity: .33; }
    #studyos-intro-skip {
      position: absolute; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      left: 50%; transform: translateX(-50%); min-height: 44px; padding: 0 16px;
      border: 1px solid var(--border); border-radius: 999px; background: var(--surface);
      color: var(--text-2); font: inherit; font-size: .875rem; cursor: pointer;
    }
    #studyos-intro-skip:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
  `;

  const cards = [...dialog.querySelectorAll('.intro-card')];
  const stage = dialog.querySelector('.intro-stage');
  const veil = dialog.querySelector('.intro-veil');
  const skip = dialog.querySelector('button');
  cards.forEach((card, i) => card.style.setProperty('--tint', (4 - i) * 5 + '%'));

  // Card Fan #04 in Motion Library uses a shared pivot and a .273 radian step.
  // Start partly open, close around that pivot, then reveal the page through the stack.
  const duration = 510;
  const clamp = value => Math.max(0, Math.min(1, value));
  function draw(elapsed) {
    const spread = .43 * (1 - clamp(elapsed / 200)) ** 2;
    cards.forEach((card, i) => {
      card.style.transform = `rotate(${(i - 2.35) * .273 * spread}rad)`;
    });
    const reveal = clamp((elapsed - 225) / (duration - 225));
    const fade = 1 - reveal * reveal * (3 - 2 * reveal);
    stage.style.transform = `translate(-50%, -50%) scale(${1 + 1.6 * reveal ** 2})`;
    stage.style.opacity = veil.style.opacity = skip.style.opacity = fade;
  }

  let frame = 0;
  let elapsed = 0;
  let lastFrame;
  function finish() {
    if (!dialog.isConnected) return;
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', syncPlayback);
    reducedMotion.removeEventListener('change', onMotionChange);
    if (dialog.open) dialog.close();
    dialog.remove();
    style.remove();
  }
  function onMotionChange(event) {
    if (event.matches) finish();
  }
  function animate() {
    if (document.hidden) return;
    const now = performance.now();
    elapsed += lastFrame === undefined ? 0 : now - lastFrame;
    lastFrame = now;
    if (elapsed >= duration) {
      finish();
      return;
    }
    draw(elapsed);
    frame = requestAnimationFrame(animate);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    if (document.hidden) return;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        finish();
        return;
      }
      try { sessionStorage.setItem(seenKey, '1'); } catch {}
    }
    lastFrame = undefined;
    frame = requestAnimationFrame(animate);
  }

  draw(0);
  document.head.append(style);
  document.body.prepend(dialog);
  dialog.addEventListener('click', finish);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });
  dialog.addEventListener('close', finish, {once: true});
  reducedMotion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();
})();

