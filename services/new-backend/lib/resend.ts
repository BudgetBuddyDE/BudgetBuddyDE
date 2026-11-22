import {Resend} from 'resend';
import {BackendConfig} from './config';
import {logger} from './logger';

let resend: Resend | undefined;
const resendLogger = logger.child({module: 'resend'});

export async function sendEmail({to, subject, text}: {to: string; subject: string; text: string}): Promise<void> {
  const {from, resendApiKey} = BackendConfig.getInstance().email;
  const client = (resend ??= new Resend(resendApiKey));
  const {error} = await client.emails.send({
    from,
    to,
    subject,
    text,
  });
  if (error) resendLogger.error('Email delivery failed', {errorName: error.name});
}
