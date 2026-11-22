import {Resend} from 'resend';
import {getConfig} from './config';
import {logger} from './logger';

let resend: Resend | undefined;
const resendLogger = logger.child({module: 'resend'});

export async function sendEmail({to, subject, text}: {to: string; subject: string; text: string}): Promise<void> {
  const config = getConfig();
  const client = (resend ??= new Resend(config.RESEND_API_KEY));
  const {error} = await client.emails.send({
    from: config.production ? 'System <auth@mail.budget-buddy.de>' : 'Acme <onboarding@resend.dev>',
    to,
    subject,
    text,
  });
  if (error) resendLogger.error('Email delivery failed', {errorName: error.name});
}
