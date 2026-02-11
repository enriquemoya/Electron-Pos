import { smtpEmailProvider } from "../../email/email-provider";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  meta?: {
    userId?: string | null;
    template?: string;
    locale?: string;
    orderId?: string | null;
  };
}) {
  await smtpEmailProvider.sendEmail(params);
}

export async function sendMagicLinkEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  meta?: {
    userId?: string | null;
    template?: string;
    locale?: string;
    orderId?: string | null;
  };
}) {
  await smtpEmailProvider.sendEmail(params);
}
