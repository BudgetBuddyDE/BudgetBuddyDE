/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  // Required environment variables
  readonly VITE_AUTH_SERVICE_HOST: string;
  readonly VITE_POCKETBASE_HOST: string;
  readonly VITE_STOCK_SERVICE_HOST: string;
  readonly VITE_MAIL_SERVICE_HOST: string;
  // Optional environment variables
  readonly VITE_SHOW_ENVIRONMENT_DISCLAIMER?: string;
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
