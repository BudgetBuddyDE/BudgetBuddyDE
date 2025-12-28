export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NODE_ENV !== "production") {
      console.log('Skipping instrumentation registration in non-production environment');
      return
    }
    await import('./instrumentation.node');
  } else console.log('Skipping instrumentation registration for non-nodejs runtime');
}
