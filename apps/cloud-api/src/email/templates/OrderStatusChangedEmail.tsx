import { Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { EmailLayout } from "../components/EmailLayout";
import { SectionCard } from "../components/EmailPrimitives";
import { LOCALE, type LocaleString } from "../locales";
import { TOKENS, SPACING, TYPOGRAPHY } from "../design-tokens";

export type OrderStatusChangedEmailInput = {
  locale: LocaleString;
  orderCode: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string | null;
};

const content = {
  [LOCALE.ES_MX]: {
    subject: "Actualización de pedido",
    preview: "El estado de tu pedido cambió.",
    title: "Actualización de pedido",
    subtitle: "Tu pedido tiene un nuevo estado.",
    orderIdLabel: "Número de pedido",
    fromLabel: "Estado anterior",
    toLabel: "Nuevo estado",
    reasonLabel: "Motivo"
  },
  [LOCALE.EN_US]: {
    subject: "Order update",
    preview: "Your order status has changed.",
    title: "Order update",
    subtitle: "Your order has a new status.",
    orderIdLabel: "Order number",
    fromLabel: "Previous status",
    toLabel: "New status",
    reasonLabel: "Reason"
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

function humanizeStatus(locale: LocaleString, status: string | null) {
  if (!status) {
    return null;
  }
  if (ORDER_STATUS_KEYS.includes(status as OrderStatusKey)) {
    return statusLabels[locale][status as OrderStatusKey];
  }
  return status;
}

export function OrderStatusChangedEmail({ locale, ...props }: OrderStatusChangedEmailInput) {
  const copy = content[locale];
  const fromStatus = humanizeStatus(locale, props.fromStatus);
  const toStatus = humanizeStatus(locale, props.toStatus);
  return (
    <EmailLayout preview={copy.preview}>
      <Text style={{ ...TYPOGRAPHY.h1, margin: 0 }}>{copy.title}</Text>
      <Text style={{ ...TYPOGRAPHY.body, color: TOKENS.MUTED_TEXT_COLOR }}>{copy.subtitle}</Text>
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.orderIdLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{props.orderCode}</Text>
        </SectionCard>
      </Section>
      {fromStatus ? (
        <Section style={{ marginTop: SPACING.md }}>
          <SectionCard title={copy.fromLabel}>
            <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{fromStatus}</Text>
          </SectionCard>
        </Section>
      ) : null}
      <Section style={{ marginTop: SPACING.md }}>
        <SectionCard title={copy.toLabel}>
          <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{toStatus}</Text>
        </SectionCard>
      </Section>
      {props.reason ? (
        <Section style={{ marginTop: SPACING.md }}>
          <SectionCard title={copy.reasonLabel}>
            <Text style={{ ...TYPOGRAPHY.body, margin: 0 }}>{props.reason}</Text>
          </SectionCard>
        </Section>
      ) : null}
    </EmailLayout>
  );
}

export async function renderOrderStatusChangedEmail(params: OrderStatusChangedEmailInput) {
  const html = await render(<OrderStatusChangedEmail {...params} />);
  const text = await render(<OrderStatusChangedEmail {...params} />, { plainText: true });
  return { subject: `${content[params.locale].subject} ${params.orderCode}`, html, text };
}
