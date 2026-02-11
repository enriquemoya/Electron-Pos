import { Button, Hr, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

import { TOKENS, SPACING, TYPOGRAPHY, RADII } from "../design-tokens";

export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: TOKENS.PRIMARY_COLOR,
        color: TOKENS.TEXT_COLOR,
        borderRadius: RADII.md,
        padding: `${SPACING.sm}px ${SPACING.lg}px`,
        textDecoration: "none",
        display: "inline-block",
        fontWeight: 600
      }}
    >
      {children}
    </Button>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "transparent",
        color: TOKENS.TEXT_COLOR,
        borderRadius: RADII.md,
        border: `1px solid ${TOKENS.BORDER_COLOR}`,
        padding: `${SPACING.sm}px ${SPACING.lg}px`,
        textDecoration: "none",
        display: "inline-block",
        fontWeight: 600
      }}
    >
      {children}
    </Button>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: TOKENS.BORDER_COLOR, margin: `${SPACING.md}px 0` }} />;
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section
      style={{
        border: `1px solid ${TOKENS.BORDER_COLOR}`,
        borderRadius: RADII.md,
        padding: SPACING.md,
        backgroundColor: TOKENS.SURFACE_COLOR
      }}
    >
      <Text style={{ ...TYPOGRAPHY.h2, margin: `0 0 ${SPACING.sm}px 0` }}>{title}</Text>
      {children}
    </Section>
  );
}
