import {Resend} from 'resend';

const {RESEND_API_KEY} = process.env;
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
export const resend = new Resend(RESEND_API_KEY);
