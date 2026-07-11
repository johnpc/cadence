# Cadence Cast receiver (visualizer / lyrics / live queue on the TV)

This is the **custom Google Cast receiver** web app that runs _on the TV_
(Chromecast / Nvidia Shield) and renders now-playing art, a visualizer, and a
live "Up next" queue while Cadence casts audio to it.

It's phase 2 of Cast-to-TV. The app (phase 1, shipped) already casts audio to the
**default** receiver. Wiring this custom receiver in is **your steps** — it needs
a Google Cast developer registration + hosting, neither of which CI can do.

## How it fits together

- The app sends audio (a Jellyfin universal-stream URL) via the Cast SDK, and
  pushes now-playing + queue updates on the custom namespace
  `urn:x-cast:io.jpc.cadence` (see `src/features/cast/castMessages.ts` +
  `castBroadcast.ts`).
- This receiver (`index.html` + `receiver.js` + `receiver.css`) listens on that
  namespace and renders the TV UI. It uses Google's CAF receiver SDK.
- The app only launches THIS receiver (instead of the default one) when a
  **receiver app id** is configured — otherwise casting is audio-only, unchanged.

## One-time setup (your steps)

1. **Host these three files** over **HTTPS** at a stable URL, e.g.
   `https://cast.jpc.io/` serving `receiver/index.html`. (Any static host works;
   the umbrel nginx or a Cloudflare Pages site both do. Cast requires HTTPS.)
2. **Register the receiver** at the [Google Cast SDK Developer Console](https://cast.google.com/publish):
   - Add a new application → **Custom Receiver**.
   - Set the **Receiver Application URL** to the URL from step 1.
   - Save. Google issues an **Application ID** (a short token like `A1B2C3D4`).
   - Under **Cast Receiver → Devices**, register your Shield's serial for testing
     (unpublished receivers only run on registered devices until you publish).
3. **Point the app at it** via the runtime config env on the deploy:
   set `CAST_RECEIVER_APP_ID=A1B2C3D4` on the Cadence container (Dockge compose
   env). `deploy/runtime-config.sh` writes it into `window.__CADENCE_CONFIG__`
   and `castReceiverAppId()` reads it. No rebuild needed — just recreate the
   container. (For the iOS app, the same value can be baked via the runtime
   config it loads.)
4. **Cast from Cadence** → the device picker → your Shield. Audio plays and the
   TV shows the Cadence now-playing UI. Tapping a new track / reordering the
   queue updates the TV live.

## Verifying

Because none of this is CI-testable (no Cast device in CI), verify on-device:

- The TV shows the cover art + title + artist of the playing track.
- The visualizer animates while playing and idles flat when paused.
- The "Up next" list matches the app's queue and highlights the current track;
  skipping / reordering in the app updates the TV within a second.
- Use the Cast console's **remote debugger** (chrome://inspect style) on the
  receiver URL to see console logs if messages aren't arriving — check the
  namespace matches `urn:x-cast:io.jpc.cadence` exactly.

## Notes / future

- The visualizer is a self-driving animation gated on play state — the receiver
  can't read the sender's audio buffer, so it's a lively approximation, not an
  FFT. A real spectrum would require decoding the stream on the receiver.
- **Lyrics** on the TV: shipped — the app broadcasts the current track's lyrics
  (karaoke-highlighting the active line) on the same namespace, and the receiver
  shows them in place of the visualizer when a track has lyrics.
