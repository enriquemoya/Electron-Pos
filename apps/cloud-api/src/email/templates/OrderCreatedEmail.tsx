import { Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { EmailLayout } from "../components/EmailLayout";
import { SectionCard } from "../components/EmailPrimitives";
import { LOCALE, type LocaleString } from "../locales";
import { TOKENS, SPACING, TYPOGRAPHY } from "../design-tokens";

export type OrderCreatedEmailInput = {
  locale: LocaleString;
  orderCode: string;
  status: string;
  subtotal: number;
  currency: string;
  expiresAt: string;
  pickupBranchName?: string | null;
};

const content = {
  [LOCALE.ES_MX]: {
    subject: "Pedido creado",
    preview: "Tu pedido fue creado con éxito.",
    title: "Pedido creado",
    subtitle: "Hemos recibido tu pedido.",
    orderIdLabel: "Número de pedido",
    statusLabel: "Estado",
    subtotalLabel: "Subtotal",
    expiresLabel: "Vence",
    pickupLabel: "Sucursal"
  },
  [LOCALE.EN_US]: {
    subject: "Order created",
    preview: "Your order was created successfully.",
    title: "Order created",
    subtitle: "We have received your order.",
    orderIdLabel: "Order number",
    statusLabel: "Status",
    subtotalLabel: "Subtotal",
    expiresLabel: "Expires",
    pickupLabel: "Pickup branch"
  }
} satisfies Record<LocaleString, Record<string, string>>;

const ORDER_STATUS_KEYS = [
  "CREATED",
  "PENDING_PAYMENT",
  "PAID",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "CANCELLED_EXPIRED",
  "CANCELLED_MANUAL",
  "CANCELED"
] as const;

type OrderStatusKey = (typeof ORDER_STATUS_KEYS)[number];

const statusLabels: Record<LocaleString, Record<OrderStatusKey, string>> = {
  [LOCALE.ES_MX]: {
    CREATED: "Creado",
    PENDING_PAYMENT: "Pago pendiente",
    PAID: "Pagado",
    READY_FOR_PICKUP: "Listo para recoger",
    SHIPPED: "Enviado",
    CANCELLED_EXPIRED: "Cancelado (expirado)",
    CANCELLED_MANUAL: "Cancelado",
    CANCELED: "Cancelado"
  },
  [LOCALE.EN_US]: {
    CREATED: "Created",
    PENDING_PAYMENT: "Pending payment",
    PAID: "Paid",
    READY_FOR_PICKUP: "Ready for pickup",
    SHIPPED: "Shipped",
    CANCELLED_EXPIRED: "Cancelled (expired)",
    CANCELLED_MANUAL: "Cancelled",
    CANCELED: "Cancelled"
  }
};

function humanizeStatus(locale: LocaleString, status: string) {
  if (ORDER_STATUS_KEYS.includes(status as OrderStatusKey)) {
    return statusLabels[locale][status as OrderStatusKey];
  }
  return status;
}

function formatMoney(amount: number, currency: string, locale: LocaleString) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export function OrderCreatedEmail({ locale, ...props }: OrderCreatedEmailInput) {
  const copy = content[locale];
  const status = humanizeStatus(locale, props.status);
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={{ ...TYPOGRAPHY.h1, margin: 0 }}>{copy.title}</Text>
      <Text style={{ ...TYPOGRAPHY.body, color: TOKENS.MUTED_TEXT_COLOR }}>{copy.subtitle}</Text>
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.orderIdLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{props.orderCode}</Text>
        </SectionCard>
      </Section>
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.statusLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{status}</Text>
        </SectionCard>
      </Section>
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.subtotalLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{formatMoney(props.subtotal, props.currency, locale)}</Text>
        </SectionCard>
      </Section>
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.expiresLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{props.expiresAt}</Text>
        </SectionCard>
      </Section>
      {props.pickupBranchName ? (
        <Section style={{ marginTop: SPACING.md }}>
          <SectionCard title={copy.pickupLabel}>
            <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{props.pickupBranchName}</Text>
          </SectionCard>
        </Section>
      ) : null}
    </EmailLayout>
  );
}

export async function renderOrderCreatedEmail(params: OrderCreatedEmailInput) {
  const html = await render(<OrderCreatedEmail {...params} />);
  const text = await render(<OrderCreatedEmail {...params} />, { plainText: true });
  return { subject: `${content[params.locale].subject} ${params.orderCode}`, html, text };
}
