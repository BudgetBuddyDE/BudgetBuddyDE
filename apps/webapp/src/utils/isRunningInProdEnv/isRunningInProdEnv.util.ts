export function isRunningInProdEnv(): boolean {
  return process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
}
