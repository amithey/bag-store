import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }
}
