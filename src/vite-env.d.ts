/// <reference types="vite/client" />

/** Injected by Vite `define` from package.json version. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Base URL of the Jellyfin server (build-time constant). */
  readonly VITE_JELLYFIN_URL: string;
  /** Optional default marlin-search (Meilisearch) indexer URL — a per-build
   * default the user can override in Settings. Empty/unset → native search. */
  readonly VITE_MARLIN_URL?: string;
  /** Optional diagnostics ingest endpoint (the cadence-logs backend). Empty/unset
   * → diagnostics stays on-device only (no upload option). */
  readonly VITE_DIAGNOSTICS_URL?: string;
  /** Optional diagnostics ingest API key (non-secret; throttles the public write
   * endpoint). Empty/unset → no upload. */
  readonly VITE_DIAGNOSTICS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
