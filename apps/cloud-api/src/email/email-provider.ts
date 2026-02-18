import nodemailer from "nodemailer";

import { appLogger } from "../config/app-logger";
import { env } from "../config/env";

export interface EmailProvider {
  sendEmail(params: {
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
  }): Promise<void>;
}

function logEvent(event: string, payload: Record<string, unknown>) {
  const meta = { event, ...payload };
  if (event === "email_send_fail") {
    appLogger.error("email event", meta);
    return;
  }
  appLogger.info("email event", meta);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: Boolean(env.smtpSecure),
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export const smtpEmailProvider: EmailProvider = {
  async sendEmail({ to, subject, html, text, meta }) {
    const attempt = {
      to,
      subject,
      template: meta?.template,
      locale: meta?.locale,
      userId: meta?.userId ?? null,
      orderId: meta?.orderId ?? null
    };

    logEvent("email_send_attempt", attempt);

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: env.fromEmail,
        to,
        subject,
        html,
        text
      });
      logEvent("email_send_success", attempt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      logEvent("email_send_fail", { ...attempt, error: message });
    }
  }
};
