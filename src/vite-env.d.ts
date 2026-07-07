/// <reference types="vite/client" />

/** Injected by Vite `define` from package.json version. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Base URL of the Jellyfin server (build-time constant). */
  readonly VITE_JELLYFIN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
