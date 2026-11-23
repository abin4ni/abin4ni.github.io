(() => {
  const seenKey = 'studyos-intro-seen';
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'reload' || navigation?.type === 'back_forward') return;
  try {
    if (sessionStorage.getItem(seenKey)) return;
  } catch {
    // The navigation type still prevents replay on reload if storage is unavailable.
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !document.body) return;

  // Each command continues from the previous one. Only the wordmark has a move.
  const wordmark = 'M 76 -52 C 68 -76 20 -65 16 -40 C 10 -13 66 -16 64 13 C 62 43 30 56 10 43 C -4 34 7 22 20 29 C 38 48 55 52 76 26'
    + ' C 83 16 83 1 88 -8 C 95 -12 113 -14 120 -12 C 124 -10 105 -7 91 -8 C 100 -27 107 -45 108 -52 C 110 -58 99 -50 94 -37 C 82 -10 78 29 88 40 C 97 50 114 35 122 17'
    + ' C 130 -1 139 -22 137 -15 C 133 5 116 42 130 46 C 147 50 160 15 166 -10 C 171 -27 169 -13 166 0 C 160 27 153 47 163 48 C 175 49 180 39 187 24'
    + ' C 196 4 212 -20 223 -12 C 231 -3 207 45 192 46 C 178 46 184 26 190 16 C 198 1 211 -13 223 -12 C 233 -28 245 -61 248 -66 C 254 -74 247 -55 241 -40 C 231 -13 214 34 221 44 C 228 52 242 35 250 19'
    + ' C 256 7 261 -6 267 -15 C 276 -28 264 1 258 22 C 248 56 274 49 288 24 C 295 11 301 -5 304 -16 C 299 9 285 48 275 69 C 262 96 245 103 241 90 C 237 76 259 64 279 53 C 295 45 310 28 321 8'
    + ' C 331 -12 331 -39 348 -51 C 373 -71 396 -54 386 -19 C 379 10 361 44 338 48 C 309 54 307 26 321 -7 C 332 -31 355 -55 378 -56 C 393 -56 402 -36 394 -19'
    + ' C 397 -41 430 -66 449 -51 C 465 -38 435 -25 417 -23 C 392 -22 404 -10 420 -3 C 445 8 441 31 418 43 C 402 51 379 47 381 35 C 383 21 408 27 422 38 C 431 44 442 38 448 30';

  // Replace this single-stroke outline and its entry/focal points when the logo is final.
  const mark = {
    entry: '480 -26',
    focus: [533, 1],
    outline: ' Q 480 -34 487 -32 Q 505 -31 516 -19 Q 531 -31 545 -32 Q 552 -33 552 -26 L 552 18 Q 552 23 546 23 Q 528 24 516 35 Q 503 25 486 23 Q 480 22 480 17 L 480 -26 Q 480 -34 487 -32 Q 505 -31 516 -19 L 516 35',
  };
  const connector = ' C 467 12 467 -21 ' + mark.entry;
  const viewBox = [-117, -225, 690, 450];

  const style = document.createElement('style');
  style.textContent = [
    '#studyos-intro { position:fixed; inset:0 auto 0 50%; transform:translateX(-50%); height:100%; max-width:none; max-height:none; margin:0; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none; overflow:hidden; overscroll-behavior:contain; touch-action:manipulation; }',
    '#studyos-intro::backdrop { background:transparent; }',
    '#studyos-intro { --veil:var(--bg,#f2e8da); --mist:rgba(255,250,242,.9); --wash:rgba(142,197,255,.27); --ink:var(--text); --rim:var(--border); --pill:var(--glass-bg); --focus:var(--ui-focus); --violet:#8a63bf; --blue:#5b73bc; --teal:#318691; --rose:#ac6c83; --mint:#387d71; }',
    '[data-theme=dark] #studyos-intro { --mist:rgba(86,90,102,.46); --wash:rgba(127,137,156,.16); --violet:#d4a3f1; --blue:#a3b9ff; --teal:#83ddd9; --rose:#efadba; --mint:#a2e9cf; }',
    '#studyos-intro .intro-veil { position:absolute; inset:0; background:radial-gradient(ellipse at 52% 47%, var(--mist), transparent 62%), radial-gradient(ellipse at 66% 46%, var(--wash), transparent 58%), var(--veil); }',
    '#studyos-intro .intro-camera { position:absolute; inset:0; pointer-events:none; }',
    '#studyos-intro .intro-camera > svg { display:block; width:100%; height:100%; overflow:hidden; }',
    '#studyos-intro-skip { position:absolute; bottom:calc(clamp(14px,5vh,48px) + env(safe-area-inset-bottom,0px)); left:50%; transform:translateX(-50%); min-height:44px; padding:0 18px; white-space:nowrap; border:1px solid var(--rim); border-radius:999px; background:var(--pill); color:var(--ink); font:inherit; font-size:.875rem; cursor:pointer; }',
    '#studyos-intro-skip:focus-visible { outline:2px solid var(--focus); outline-offset:3px; }',
  ].join('\n');

  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.id = 'studyos-intro';
  dialog.setAttribute('aria-label', 'StudyOS 開場動畫');
  dialog.innerHTML = [
    '<div class="intro-veil"></div>',
    '<div class="intro-camera" aria-hidden="true"><svg viewBox="' + viewBox.join(' ') + '" focusable="false">',
    '<defs>',
    '<linearGradient id="intro-ink" gradientUnits="userSpaceOnUse" x1="0" y1="43" x2="552" y2="-30">',
    '<stop stop-color="var(--violet)"/><stop offset=".23" stop-color="var(--blue)"/><stop offset=".48" stop-color="var(--teal)"/><stop offset=".72" stop-color="var(--rose)"/><stop offset="1" stop-color="var(--mint)"/>',
    '</linearGradient>',
    '<path id="intro-route" d="' + wordmark + '"/>',
    '<filter id="intro-glow" x="-12%" y="-45%" width="124%" height="190%"><feGaussianBlur stdDeviation="5"/></filter>',
    '</defs>',
    '<g fill="none" stroke="url(#intro-ink)" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round">',
    '<g class="intro-trail"><use href="#intro-route" filter="url(#intro-glow)" opacity=".45"/><use href="#intro-route"/></g>',
    '<g class="intro-lead" opacity="0"><use class="intro-lead-glow" href="#intro-route" filter="url(#intro-glow)" opacity=".45"/><use href="#intro-route"/></g>',
    '<circle class="intro-tip" r="2.45" fill="white" opacity=".45" stroke="none"/>',
    '</g></svg></div>',
    '<button type="button" id="studyos-intro-skip" autofocus>跳過動畫</button>',
  ].join('');

  document.head.append(style);
  document.body.prepend(dialog);

  const route = dialog.querySelector('#intro-route');
  const tip = dialog.querySelector('.intro-tip');
  const trail = dialog.querySelector('.intro-trail');
  const lead = dialog.querySelector('.intro-lead');
  const camera = dialog.querySelector('.intro-camera');
  let leadGlow = dialog.querySelector('.intro-lead-glow');
  const veil = dialog.querySelector('.intro-veil');
  const skip = dialog.querySelector('button');
  const wordLength = route.getTotalLength();
  route.setAttribute('d', wordmark + connector);
  const markStart = route.getTotalLength();
  route.setAttribute('d', wordmark + connector + mark.outline);
  const length = route.getTotalLength();

  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => value * value * (3 - 2 * value);
  // The two passes share identical geometry. The trailing pass fades behind the pen.
  const drawStroke = (layer, from, to) => {
    layer.setAttribute('stroke-dasharray', Math.max(0, to - from) + ' ' + length);
    layer.setAttribute('stroke-dashoffset', -from);
  };
  const moveTip = distance => {
    const point = route.getPointAtLength(distance);
    tip.setAttribute('cx', point.x);
    tip.setAttribute('cy', point.y);
  };

  let frame = 0;
  let elapsed = 0;
  let previousFrame;
  let finished = false;
  const previousFocus = document.activeElement;
  let offsetX, offsetY;
  function sizeDialog() {
    // The calendar's scrollbar gutter shrinks CSS viewport units on desktop.
    const width = window.innerWidth;
    dialog.style.width = width + 'px';
    const height = dialog.clientHeight || window.innerHeight;
    const [left, top, viewWidth, viewHeight] = viewBox;
    const unit = Math.min(width / viewWidth, height / viewHeight);
    offsetX = (left + viewWidth / 2 - mark.focus[0]) * unit;
    offsetY = (top + viewHeight / 2 - mark.focus[1]) * unit;
    camera.style.transformOrigin = (width / 2 - offsetX) + 'px ' + (height / 2 - offsetY) + 'px';
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', sizeDialog);
    document.removeEventListener('visibilitychange', syncPlayback);
    reducedMotion.removeEventListener('change', onMotionChange);
    window.removeEventListener('keydown', onKey, true);
    if (dialog.open) dialog.close();
    dialog.remove();
    style.remove();
    if (previousFocus instanceof HTMLElement && previousFocus !== document.body &&
        previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function onMotionChange(event) {
    if (event.matches) finish();
  }
  function onKey(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    finish();
  }

  const writeTime = 2430;
  const markTime = 990;
  const markEnd = writeTime + markTime;
  const pushStart = markEnd - 210;
  const pushEnd = markEnd + 660;
  let bookComplete = false;
  let prepared = false;
  function syncPlayback() {
    cancelAnimationFrame(frame);
    previousFrame = undefined;
    if (!document.hidden) frame = requestAnimationFrame(animate);
  }
  function animate(now) {
    if (document.hidden) return;
    if (previousFrame !== undefined) {
      // Slow or suspended rendering should not skip past the visible drawing.
      elapsed += Math.min(now - previousFrame, 100);
    } else if (elapsed === 0) {
      try { sessionStorage.setItem(seenKey, '1'); } catch {}
    }
    previousFrame = now;
    if (elapsed < writeTime) {
      const pace = elapsed / writeTime;
      const distance = wordLength * (pace + .055 * Math.sin(Math.PI * pace));
      drawStroke(trail, 0, distance);
      moveTip(distance);
    } else if (!bookComplete) {
      const pace = clamp((elapsed - writeTime) / markTime);
      const distance = wordLength + (length - wordLength) * (pace + .17 * Math.sin(Math.PI * pace));
      const tail = wordLength - 2 + (markStart - wordLength + 2) * smooth(clamp((pace - .60) / .40));
      drawStroke(trail, 0, wordLength);
      trail.setAttribute('opacity', 1 - smooth(clamp((pace - .06) / .74)));
      drawStroke(lead, tail, distance);
      lead.setAttribute('opacity', 1);
      moveTip(distance);
      if (pace >= .90) tip.setAttribute('opacity', .45 * (1 - smooth(clamp((pace - .90) / .10))));
      bookComplete = pace === 1;
    }

    if (!prepared && elapsed >= pushStart - 85) {
      prepared = true;
      camera.style.willChange = 'transform, opacity';
      veil.style.willChange = 'opacity';
    }
    if (elapsed >= pushStart) {
      const pace = clamp((elapsed - pushStart) / (pushEnd - pushStart));
      const scale = Math.exp(2.95 * Math.pow(pace, 1.48));
      const pan = smooth(clamp(pace / .87));

      // Fade out the blur before the largest scales. After the last stroke the SVG stays static.
      if (leadGlow) {
        const glow = 1 - smooth(clamp(pace / .28));
        if (glow > 0) leadGlow.style.opacity = .45 * glow;
        else {
          leadGlow.remove();
          leadGlow = null;
        }
      }

      camera.style.transform = 'translate3d(' + offsetX * pan + 'px,' + offsetY * pan + 'px,0) scale(' + scale + ')';
      const reveal = smooth(clamp((pace - .15) / .85));
      veil.style.opacity = 1 - reveal;
      skip.style.opacity = 1 - reveal;
      camera.style.opacity = 1 - smooth(clamp((pace - .27) / .73));
      if (pace === 1) {
        finish();
        return;
      }
    }
    frame = requestAnimationFrame(animate);
  }

  sizeDialog();
  drawStroke(trail, 0, 0);
  moveTip(0);
  try {
    dialog.showModal();
  } catch {
    finish();
    return;
  }
  dialog.addEventListener('click', finish);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });
  dialog.addEventListener('close', finish, { once: true });
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', sizeDialog);
  reducedMotion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();
})();

