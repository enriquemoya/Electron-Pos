import CreditClient from "./credit-client";

// Required for output: "export" builds. Dynamic params resolved client-side.
export function generateStaticParams() {
  return [];
}

export default function CreditPage() {
  return <CreditClient />;
}
