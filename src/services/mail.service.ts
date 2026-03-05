import 'server-only';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult =
  | { success: true; provider: 'resend'; id: string }
  | { success: true; provider: 'log' }
  | { success: false; provider: 'resend'; status?: number; error: string };

const resendClient = (() => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
})();

export const MailService = {
  async sendEmail({ to, subject, html }: EmailPayload) {
    const envFrom = process.env.MAIL_FROM;
    const from =
      envFrom ||
      (process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : null);
    if (resendClient) {
      if (!from) {
        return {
          success: false,
          provider: 'resend',
          error: 'MAIL_FROM is required in production and must be a verified Resend domain',
        } satisfies SendEmailResult;
      }
      try {
        const { data, error } = await resendClient.emails.send({
          from,
          to,
          subject,
          html,
        });
        if (error) {
          const err = error as unknown as { message?: string; name?: string; statusCode?: number };
          logger.error('MAIL_SEND_ERROR', 'Resend rejected request', {
            status: err.statusCode,
            to,
            subject,
            error: err,
          });
          return {
            success: false,
            provider: 'resend',
            status: err.statusCode,
            error: err.message || err.name || 'Resend rejected request',
          } satisfies SendEmailResult;
        }
        const id = (data as unknown as { id?: string } | null)?.id || 'unknown';
        logger.info('MAIL_SENT', 'Email sent via Resend', { to, subject, id });
        return { success: true, provider: 'resend', id } satisfies SendEmailResult;
      } catch (error) {
        logger.error('MAIL_RESEND_FAILURE', error, { to, subject });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, provider: 'resend', error: message } satisfies SendEmailResult;
      }
    }
    logger.info('MAIL_FAKE_SEND', 'No provider configured; logging email', { to, subject });
    logger.debug('MAIL_HTML', html ? 'HTML length=' + html.length : 'no html');
    return { success: true, provider: 'log' } satisfies SendEmailResult;
  },
  buildVerificationHtml(verifyUrl: string) {
    return `
      <div style="font-family:Arial,sans-serif;padding:24px">
        <h2 style="color:#111">Verify your email</h2>
        <p>Please click the button below to verify your Subly account.</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none">Verify Email</a>
        </p>
        <p>This link expires in 24 hours. If you did not request this, you can ignore this email.</p>
      </div>
    `;
  },
};
