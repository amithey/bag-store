import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/adminAuth";
import { getRecentOrders } from "@/lib/supabaseOrders";
import { getSupabaseAdminClient } from "@/lib/supabase/clients";
import AdminNav from "../_components/AdminNav";

export const metadata: Metadata = {
  title: "ניהול | smadar heymans",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

// Wraps every screen of the admin. Checking the login here is a convenience that
// sends a signed-out visitor to the password box; the real protection is the
// check inside every action that changes anything (app/admin/_actions).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured() || !getSupabaseAdminClient() || !(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  // A number on the "orders" tab for orders still waiting for the owner.
  let openOrders = 0;
  try {
    openOrders = (await getRecentOrders()).filter(isOpen).length;
  } catch {
    // The orders tab itself explains a problem; the badge just stays empty.
  }

  return (
    <div dir="rtl" className="min-h-screen bg-cream text-ink">
      <AdminNav openOrders={openOrders} />
      <main className="mx-auto max-w-6xl px-4 pb-40 pt-6 md:px-8 md:pt-8">{children}</main>
    </div>
  );
}

function isOpen(order: { status: string; payment_status: string }) {
  return !(
    order.payment_status === "paid" ||
    order.payment_status === "cancelled" ||
    order.status === "paid" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  );
}
