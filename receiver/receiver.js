/*
 * Cadence Cast receiver — runs on the TV (Chromecast / Nvidia Shield).
 *
 * Plays the audio the sender casts (a Jellyfin universal-stream URL) via the
 * default CAF media pipeline, AND listens on Cadence's custom namespace for
 * now-playing + queue messages (see src/features/cast/castMessages.ts) to render
 * the cover art, a lightweight canvas visualizer, and a live "Up next" list.
 *
 * The namespace MUST match CAST_NAMESPACE in the app.
 */
const NAMESPACE = 'urn:x-cast:io.jpc.cadence';

const el = (id) => document.getElementById(id);
const artEl = el('art');
const bgEl = el('bg');
const titleEl = el('title');
const artistEl = el('artist');
const idleEl = el('idle');
const queueEl = el('queue');
const lyricsEl = el('lyrics');
const vizEl = el('viz');

/** Render the now-playing panel from a {title, artist, artUrl, isPlaying} msg. */
function renderNowPlaying(m) {
  titleEl.textContent = m.title || 'Cadence';
  artistEl.textContent = m.artist || '';
  idleEl.style.display = 'none';
  if (m.artUrl) {
    artEl.src = m.artUrl;
    bgEl.style.backgroundImage = `url("${m.artUrl}")`;
  }
  document.body.classList.toggle('is-paused', m.isPlaying === false);
}

/** Render the "Up next" list from a {tracks, index} message, highlighting the
 * current track and showing what follows. */
function renderQueue(m) {
  queueEl.innerHTML = '';
  const tracks = Array.isArray(m.tracks) ? m.tracks : [];
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'queue__item' + (i === m.index ? ' queue__item--current' : '');
    const title = document.createElement('span');
    title.className = 'queue__title';
    title.textContent = t.title || '';
    const artist = document.createElement('span');
    artist.className = 'queue__artist';
    artist.textContent = t.artist || '';
    li.append(title, artist);
    queueEl.append(li);
  });
}

/** Render karaoke lyrics from a {lines, activeIndex} message. When there are no
 * lines, hide the lyric list and show the visualizer instead. Scrolls the active
 * line into view and highlights it. */
function renderLyrics(m) {
  const lines = Array.isArray(m.lines) ? m.lines : [];
  const hasLyrics = lines.length > 0;
  lyricsEl.hidden = !hasLyrics;
  vizEl.hidden = hasLyrics; // lyrics take the visualizer's place when present
  if (!hasLyrics) {
    lyricsEl.innerHTML = '';
    return;
  }
  // Rebuild only when the line set changed (cheap: compare count + first text).
  const sig = lines.length + '|' + (lines[0] ? lines[0].text : '');
  if (lyricsEl.dataset.sig !== sig) {
    lyricsEl.dataset.sig = sig;
    lyricsEl.innerHTML = '';
    lines.forEach((l) => {
      const li = document.createElement('li');
      li.className = 'lyrics__line';
      li.textContent = l.text || '';
      lyricsEl.append(li);
    });
  }
  const items = lyricsEl.children;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle('lyrics__line--active', i === m.activeIndex);
  }
  const activeEl = items[m.activeIndex];
  if (activeEl) activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function handleMessage(data) {
  try {
    const m = typeof data === 'string' ? JSON.parse(data) : data;
    if (m && m.type === 'nowPlaying') renderNowPlaying(m);
    else if (m && m.type === 'queue') renderQueue(m);
    else if (m && m.type === 'lyrics') renderLyrics(m);
  } catch (_e) {
    /* ignore malformed messages — never break the receiver */
  }
}

// ---- Canvas visualizer -----------------------------------------------------
// A self-driving bar visualizer. The receiver can't read the sender's audio
// buffer, so this is a smooth animated approximation gated on play state (it
// idles flat when paused) — a lively backdrop, not an FFT.
function startVisualizer() {
  const canvas = el('viz');
  const ctx = canvas.getContext('2d');
  const bars = 48;
  const phase = new Array(bars).fill(0).map((_, i) => i * 0.35);
  let t = 0;
  const draw = () => {
    const paused = document.body.classList.contains('is-paused');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width / bars;
    for (let i = 0; i < bars; i++) {
      const amp = paused ? 0.06 : 0.5 + 0.5 * Math.sin(t + phase[i]);
      const h = 8 + amp * (canvas.height - 12);
      ctx.fillStyle = 'rgba(29,185,84,0.85)'; // Cadence accent green
      ctx.fillRect(i * w + 2, canvas.height - h, w - 4, h);
    }
    t += paused ? 0.01 : 0.08;
    requestAnimationFrame(draw);
  };
  draw();
}

// ---- CAF receiver bootstrap ------------------------------------------------
const context = cast.framework.CastReceiverContext.getInstance();
context.addCustomMessageListener(NAMESPACE, (event) => handleMessage(event.data));
startVisualizer();
context.start();
