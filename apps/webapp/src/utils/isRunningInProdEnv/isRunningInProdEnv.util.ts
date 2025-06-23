export function isRunningInProdEnv(): boolean {
  return import.meta.env.PROD;
}
