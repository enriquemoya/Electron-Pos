import { Img, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

import { EmailLayout } from "../components/EmailLayout";
import { PrimaryButton, SectionCard } from "../components/EmailPrimitives";
import { getBranding } from "../branding";
import { LOCALE, type LocaleString } from "../locales";
import { TOKENS, SPACING, TYPOGRAPHY } from "../design-tokens";

export type OrderCreatedEmailInput = {
  locale: LocaleString;
  orderCode: string;
  status: string;
  paymentMethod: string;
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
    pickupLabel: "Sucursal",
    transferTitle: "Pago por transferencia",
    transferBody: "Envia tu comprobante de pago por WhatsApp para validar tu orden.",
    transferButton: "Enviar comprobante por WhatsApp"
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
    pickupLabel: "Pickup branch",
    transferTitle: "Bank transfer payment",
    transferBody: "Send your payment receipt via WhatsApp to validate your order.",
    transferButton: "Send receipt via WhatsApp"
  }
} satisfies Record<LocaleString, Record<string, string>>;

const ORDER_STATUS_KEYS = [
  "CREATED",
  "PENDING_PAYMENT",
  "PAID",
  "PAID_BY_TRANSFER",
  "READY_FOR_PICKUP",
  "COMPLETED",
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
    PAID_BY_TRANSFER: "Transferencia validada",
    READY_FOR_PICKUP: "Listo para recoger",
    COMPLETED: "Completado",
    SHIPPED: "Enviado",
    CANCELLED_EXPIRED: "Cancelado (expirado)",
    CANCELLED_MANUAL: "Cancelado",
    CANCELED: "Cancelado"
  },
  [LOCALE.EN_US]: {
    CREATED: "Created",
    PENDING_PAYMENT: "Pending payment",
    PAID: "Paid",
    PAID_BY_TRANSFER: "Transfer validated",
    READY_FOR_PICKUP: "Ready for pickup",
    COMPLETED: "Completed",
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
  const branding = getBranding();
  const wireImageUrl = branding.wirePaymentUrl;
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
      {props.paymentMethod === "BANK_TRANSFER" ? (
        <Section style={{ marginTop: SPACING.lg }}>
          <SectionCard title={copy.transferTitle}>
            {wireImageUrl ? (
              <Img
                src={wireImageUrl}
                alt={copy.transferTitle}
                width="520"
                height="320"
                style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }}
              />
            ) : null}
            <Text style={{ ...TYPOGRAPHY.body, margin: `${SPACING.md}px 0 0 0` }}>
              {copy.transferBody}
            </Text>
            <Section style={{ marginTop: SPACING.sm }}>
              <PrimaryButton href="https://wa.me/526621814655">{copy.transferButton}</PrimaryButton>
            </Section>
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
