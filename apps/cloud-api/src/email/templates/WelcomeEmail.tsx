import { Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { EmailLayout } from "../components/EmailLayout";
import { PrimaryButton } from "../components/EmailPrimitives";
import { LOCALE, type LocaleString } from "../locales";
import { TOKENS, SPACING, TYPOGRAPHY } from "../design-tokens";
import { getBranding } from "../branding";

export type WelcomeEmailInput = {
  locale: LocaleString;
  firstName?: string | null;
};

const content = {
  [LOCALE.ES_MX]: {
    subject: "¡Bienvenido a DanimeZone!",
    preview: "Tu cuenta está lista.",
    title: "Bienvenido a DanimeZone",
    body: "Gracias por unirte. Explora el catálogo y descubre tus favoritos.",
    cta: "Ver tienda"
  },
  [LOCALE.EN_US]: {
    subject: "Welcome to DanimeZone!",
    preview: "Your account is ready.",
    title: "Welcome to DanimeZone",
    body: "Thanks for joining. Explore the catalog and find your favorites.",
    cta: "Shop now"
  }
} satisfies Record<LocaleString, Record<string, string>>;

export function WelcomeEmail({ locale, firstName }: WelcomeEmailInput) {
  const copy = content[locale];
  const branding = getBranding();
  const greeting = firstName ? `${copy.title}, ${firstName}` : copy.title;

  return (
    <EmailLayout preview={copy.preview}>
      <Text style={{ ...TYPOGRAPHY.h1, margin: 0 }}>{greeting}</Text>
      <Text style={{ ...TYPOGRAPHY.body, color: TOKENS.MUTED_TEXT_COLOR }}>{copy.body}</Text>
      <Section style={{ marginTop: SPACING.md }}>
        <PrimaryButton href={branding.storeUrl}>
          {copy.cta}
        </PrimaryButton>
      </Section>
    </EmailLayout>
  );
}

export async function renderWelcomeEmail(params: WelcomeEmailInput) {
  const html = await render(<WelcomeEmail {...params} />);
  const text = await render(<WelcomeEmail {...params} />, { plainText: true });
  return { subject: content[params.locale].subject, html, text };
}
