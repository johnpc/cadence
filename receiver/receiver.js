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

function handleMessage(data) {
  try {
    const m = typeof data === 'string' ? JSON.parse(data) : data;
    if (m && m.type === 'nowPlaying') renderNowPlaying(m);
    else if (m && m.type === 'queue') renderQueue(m);
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
