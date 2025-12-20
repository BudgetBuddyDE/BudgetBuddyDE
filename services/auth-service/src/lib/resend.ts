import {type CreateEmailResponseSuccess, Resend} from 'resend';

import {config} from '../config';
import type {ServiceResponse} from '../types';

class ResendManager {
  private resend: Resend;
  private readonly fromMailAdress: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY as string);
    this.fromMailAdress =
      config.runtime === 'production' ? 'System <auth@mail.budget-buddy.de>' : 'Acme <onboarding@resend.dev>';
  }

  public async sendVerificationEmail(
    to: string,
    verificationLink: string,
  ): Promise<ServiceResponse<CreateEmailResponseSuccess>> {
    const {data, error} = await this.resend.emails.send({
      from: this.fromMailAdress,
      to: [to],
      subject: 'Verify your email address',
      html: `<strong>Please click the following link to verify your email address:</strong> <a href="${verificationLink}">Confirm address</a>`,
    });

    if (error) {
      return [null, error];
    }

    return [data, null];
  }

  public async sendChangeEmailRequest(
    previousEmail: string,
    newMail: string,
    changeEmailLink: string,
  ): Promise<ServiceResponse<CreateEmailResponseSuccess>> {
    const {data, error} = await this.resend.emails.send({
      from: this.fromMailAdress,
      to: [previousEmail],
      subject: 'Confirm change of your email address',
      html: `<strong>Please click the following link to verify the change of your email address from ${previousEmail} to ${newMail}:</strong> <a href="${changeEmailLink}">Confirm change of my mail address</a>`,
    });

    if (error) {
      return [null, error];
    }

    return [data, null];
  }

  public async sendPasswordReset(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<ServiceResponse<CreateEmailResponseSuccess>> {
    const {data, error} = await this.resend.emails.send({
      from: this.fromMailAdress,
      to: [to],
      subject: 'Reset your password',
      html: `
        <p>Hey ${name},<br />
        we received a request to reset your password. If you made this request, please click the link below:<br />
        <a href="${resetLink}">Reset your password</a><br />
        If you did not request a password reset, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      return [null, error];
    }

    return [data, null];
  }

  public async sendAccountDeletionVerification(
    to: string,
    resetLink: string,
  ): Promise<ServiceResponse<CreateEmailResponseSuccess>> {
    const {data, error} = await this.resend.emails.send({
      from: this.fromMailAdress,
      to: [to],
      subject: 'Deletion of your account',
      html: `
        <p>Hey,<br />
        we received a request to delete your account. If you made this request, please click the link below:<br />
        <a href="${resetLink}">Confirm account deletion</a><br />
        If you did not request account deletion, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      return [null, error];
    }

    return [data, null];
  }
}

export const resendManager = new ResendManager();
