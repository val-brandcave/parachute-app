import { TrustCenter } from "@/components/organisms/trust/TrustCenter";

/** Public view for IT: same content, no account, no shell. The token "expired" shows the expired state. */
export default async function SharedTrustPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main>
      <TrustCenter mode="public" expired={token === "expired"} />
    </main>
  );
}
