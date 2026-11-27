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
      --intro-rear: var(--sunken-h);
      --intro-rear-light: var(--sunken);
      --intro-middle: var(--bg);
      --intro-front-shade: var(--card-2);
      --intro-front: var(--elevated);
      --intro-inset: var(--sunken);
    }
    :root[data-theme=dark] #studyos-intro {
      --intro-rear: var(--surface);
      --intro-rear-light: var(--card-2);
      --intro-middle: var(--sunken);
      --intro-front-shade: var(--elevated);
      --intro-front: var(--accent-tint);
      --intro-inset: var(--sunken-h);
    }
    #studyos-intro::backdrop { background: transparent; }
    #studyos-intro .intro-veil { position: absolute; inset: 0; background: var(--bg); }
    #studyos-intro .intro-stage {
      position: absolute; top: 50%; left: 50%; width: clamp(74px, 18vmin, 112px);
      aspect-ratio: 38 / 51; transform: translate(-50%, -50%);
    }
    #studyos-intro .intro-card {
      position: absolute; inset: 0; padding: 12%; border: 1px solid var(--border-strong);
      border-radius: 12%; background: var(--intro-rear);
      box-shadow: var(--shadow-md);
      transform-origin: 50% 118.63%;
    }
    #studyos-intro .intro-card:nth-child(2) { background: var(--intro-rear-light); }
    #studyos-intro .intro-card:nth-child(3) { background: var(--intro-middle); }
    #studyos-intro .intro-card:nth-child(4) { background: var(--intro-front-shade); }
    #studyos-intro .intro-card:last-child {
      background: var(--intro-front);
      /* The thin edges remain visible when the cards share an angle. */
      box-shadow: 0 2px 0 -1px var(--intro-middle), 0 4px 0 -2px var(--intro-rear), var(--shadow-md);
    }
    #studyos-intro .intro-card span {
      display: block; height: 54%; border-radius: 14%; background: var(--intro-inset);
      box-shadow: inset 0 0 0 1px var(--border-lt);
    }
    #studyos-intro .intro-card::before, #studyos-intro .intro-card::after {
      content: ''; position: absolute; left: 12%; top: 64%; width: 51%; height: 4%;
      border-radius: 999px; background: var(--text-2); opacity: .5;
    }
    #studyos-intro .intro-card::after { top: 77%; width: 24%; background: var(--selection-indicator); opacity: .8; }
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

  // Card Fan #04 in Motion Library uses a shared pivot and a .273 radian step.
  const openStart = 24;
  const openEnd = 170;
  const closeStart = 260;
  const closeEnd = 400;
  const duration = 580;

  function ease(progress) {
    const t = Math.max(0, Math.min(1, progress));
    return t * t * (3 - 2 * t);
  }

  function draw(elapsed) {
    const opened = ease((elapsed - openStart) / (openEnd - openStart));
    const closed = ease((elapsed - closeStart) / (closeEnd - closeStart));
    const spread = opened * (1 - closed);
    cards.forEach((card, i) => {
      card.style.transform = `rotate(${(i - 2.35) * .273 * spread}rad)`;
    });
    const reveal = ease((elapsed - closeEnd) / (duration - closeEnd));
    const fade = 1 - reveal;
    stage.style.transform = `translate(-50%, -50%) scale(${1 + 1.6 * reveal})`;
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
    const delta = lastFrame === undefined ? 0 : now - lastFrame;
    // Keep the opening readable if startup drops a frame.
    elapsed += elapsed < closeStart ? Math.min(delta, 48) : delta;
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

