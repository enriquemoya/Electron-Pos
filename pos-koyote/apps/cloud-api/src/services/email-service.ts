import nodemailer from "nodemailer";

import { env } from "../config/env";

export async function sendMagicLinkEmail(params: { to: string; subject: string; html: string; text: string }) {
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text
  });
}
