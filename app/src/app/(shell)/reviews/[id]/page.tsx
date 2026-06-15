import { redirect } from "next/navigation";

export default async function ReviewIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/reviews/${id}/technical`);
}
