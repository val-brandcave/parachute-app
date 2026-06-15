import { ReviewContextBar } from "@/components/shell/ReviewContextBar";

export default async function ReviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <ReviewContextBar reviewId={id} />
      {children}
    </>
  );
}
