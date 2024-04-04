const PocketBase = require('pocketbase/cjs');

const {POCKETBASE_URL} = process.env;
if (!POCKETBASE_URL) throw new Error('POCKETBASE_URL is not set');
export const pb = new PocketBase(POCKETBASE_URL);
