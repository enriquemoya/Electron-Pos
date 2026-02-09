import TournamentDetailClient from "./tournament-detail-client";

// Required for output: "export" builds. Dynamic params resolved client-side.
export function generateStaticParams() {
  return [{ id: "detail" }];
}

export default function TournamentDetailPage() {
  return <TournamentDetailClient />;
}
