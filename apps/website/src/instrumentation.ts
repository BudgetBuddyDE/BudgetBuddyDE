export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // await import('./instrumentation.node');
    console.log('Skipping instrumentation registration for nodejs runtime');
  } else console.log('Skipping instrumentation registration for non-nodejs runtime');
}
