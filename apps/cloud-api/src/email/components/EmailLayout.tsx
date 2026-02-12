import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text
} from "@react-email/components";
import type { ReactNode } from "react";

import { TOKENS, SPACING, TYPOGRAPHY, RADII } from "../design-tokens";
import { getBranding } from "../branding";

const baseStyles = {
  body: {
    backgroundColor: TOKENS.BACKGROUND_COLOR,
    color: TOKENS.TEXT_COLOR,
    fontFamily: TYPOGRAPHY.fontFamily,
    padding: SPACING.lg
  },
  container: {
    backgroundColor: TOKENS.SURFACE_COLOR,
    borderRadius: RADII.lg,
    border: `1px solid ${TOKENS.BORDER_COLOR}`,
    padding: SPACING.lg
  },
  header: {
    paddingBottom: SPACING.md
  },
  footer: {
    paddingTop: SPACING.md
  }
};

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  const branding = getBranding();

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.header}>
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={branding.appName}
                width="75"
                height="75"
                style={{ display: "block", marginBottom: SPACING.sm }}
              />
            ) : null}
            <Text style={{ ...TYPOGRAPHY.h2, margin: 0 }}>{branding.appName}</Text>
          </Section>

          {children}

          <Hr style={{ borderColor: TOKENS.BORDER_COLOR, margin: `${SPACING.lg}px 0` }} />
          <Section style={baseStyles.footer}>
            <Text style={{ ...TYPOGRAPHY.small, color: TOKENS.MUTED_TEXT_COLOR, margin: 0 }}>
              {branding.appName}
            </Text>
            <Text style={{ ...TYPOGRAPHY.small, color: TOKENS.MUTED_TEXT_COLOR, margin: 0 }}>
              {branding.supportEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
