import { redirect } from "next/navigation";

// Redirect permanente verso la nuova pagina /guida
export default async function BenvenutoRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/checkin/${id}/guida`);
}
