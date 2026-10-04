import { redirect } from "next/navigation";

/** Jobcenter URL preserved — hub lives at /field-services. */
export default function StarlinkInstallRedirectPage() {
  redirect("/field-services?group=starlink");
}
