import { TrustCenter } from "@/components/organisms/trust/TrustCenter";

export default function TrustPage() {
  return (
    <div className="pagebody">
      <TrustCenter mode="signed-in" />
    </div>
  );
}
