import { redirect } from "next/navigation";

export default async function MechanicServiceRedirect({ params }) {
  const { service } = await params;
  redirect(`/services/${service}`);
}
