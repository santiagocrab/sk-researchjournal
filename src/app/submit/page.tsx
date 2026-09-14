import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/rbac";

export const metadata = { title: "Submit your research" };

export default async function SubmitPage() {
  const user = await getSessionFromCookies();
  if (user && canAccessAdmin(user)) redirect("/admin/submissions");
  redirect("/login?intent=submit&mode=signup&next=%2Fadmin%2Fsubmissions");
}
