export const appConfig = Object.freeze({
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST ?? 'http://localhost:9000',
  authUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST ?? 'http://localhost:8080',
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
  maxAttachmentBytes: 10 * 1024 * 1024,
  attachmentMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'] as const,
});
