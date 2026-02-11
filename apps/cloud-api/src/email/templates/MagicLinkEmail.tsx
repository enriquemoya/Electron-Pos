import { Link, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { EmailLayout } from "../components/EmailLayout";
import { PrimaryButton, Divider } from "../components/EmailPrimitives";
import { LOCALE, type LocaleString } from "../locales";
import { TOKENS, SPACING, TYPOGRAPHY } from "../design-tokens";

export type MagicLinkEmailInput = {
  locale: LocaleString;
  link: string;
};

const content = {
  [LOCALE.ES_MX]: {
    subject: "Tu enlace mágico para DanimeZone",
    preview: "Usa este enlace para iniciar sesión.",
    title: "Inicia sesión en DanimeZone",
    body: "Haz clic en el botón para acceder a tu cuenta.",
    cta: "Iniciar sesión",
    fallback: "Si el botón no funciona, usa este enlace:",
    safety: "Este enlace expira pronto por tu seguridad."
  },
  [LOCALE.EN_US]: {
    subject: "Your magic link for DanimeZone",
    preview: "Use this link to sign in.",
    title: "Sign in to DanimeZone",
    body: "Click the button below to access your account.",
    cta: "Sign in",
    fallback: "If the button doesn't work, use this link:",
    safety: "This link expires soon for your security."
  }
} satisfies Record<LocaleString, Record<string, string>>;

export function MagicLinkEmail({ locale, link }: MagicLinkEmailInput) {
  const copy = content[locale];
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={{ ...TYPOGRAPHY.h1, margin: 0 }}>{copy.title}</Text>
      <Text style={{ ...TYPOGRAPHY.body, color: TOKENS.MUTED_TEXT_COLOR }}>{copy.body}</Text>
      <Section style={{ marginTop: SPACING.md }}>
        <PrimaryButton href={link}>{copy.cta}</PrimaryButton>
      </Section>
      <Divider />
      <Text style={{ ...TYPOGRAPHY.body, color: TOKENS.MUTED_TEXT_COLOR }}>{copy.fallback}</Text>
      <Link href={link} style={{ color: TOKENS.PRIMARY_COLOR, wordBreak: "break-all" }}>
        {link}
      </Link>
      <Text style={{ ...TYPOGRAPHY.small, color: TOKENS.MUTED_TEXT_COLOR, marginTop: SPACING.md }}>
        {copy.safety}
      </Text>
    </EmailLayout>
  );
}

export async function renderMagicLinkEmail(params: MagicLinkEmailInput) {
  const html = await render(<MagicLinkEmail {...params} />);
  const text = await render(<MagicLinkEmail {...params} />, { plainText: true });
  return { subject: content[params.locale].subject, html, text };
}
