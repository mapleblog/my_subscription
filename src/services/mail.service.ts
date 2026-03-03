import 'server-only';
import { logger } from '@/lib/logger';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export const MailService = {
  async sendEmail({ to, subject, html }: EmailPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM || 'no-reply@subly.app';
    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to, subject, html }),
        });
        const json = await res.json();
        if (!res.ok) {
          logger.error('MAIL_SEND_ERROR', json);
          return false;
        }
        logger.info('MAIL_SENT', 'Email sent via Resend', { to, subject });
        return true;
      } catch (error) {
        logger.error('MAIL_RESEND_FAILURE', error, { to });
        return false;
      }
    }
    logger.info('MAIL_FAKE_SEND', 'No provider configured; logging email', { to, subject });
    logger.debug('MAIL_HTML', html ? 'HTML length=' + html.length : 'no html');
    return true;
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
