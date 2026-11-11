"use server";

import { revalidatePath } from "next/cache";
import { updateOrderRecordStatus, type OrderStatus } from "@/lib/supabaseOrders";
import { assertSameOrigin } from "@/lib/requestSecurity";
import { requireAdmin } from "./guards";

export async function updateOrderStatus(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  let status = parseOrderStatus(String(formData.get("status") || "new"));
  let paymentStatus = parsePaymentStatus(String(formData.get("paymentStatus") || "pending"));
  const internalNote = formData.has("internalNote")
    ? String(formData.get("internalNote") || "")
    : undefined;

  if (!id) return;

  if (status === "paid" || status === "delivered") {
    paymentStatus = "paid";
  }

  if (status === "cancelled") {
    paymentStatus = "cancelled";
  }

  if (paymentStatus === "paid" && status !== "delivered" && status !== "cancelled") {
    status = "paid";
  }

  if (paymentStatus === "cancelled") {
    status = "cancelled";
  }

  await updateOrderRecordStatus(id, status, paymentStatus, internalNote);
  revalidatePath("/admin");
}

function parseOrderStatus(value: string): OrderStatus {
  const allowed: OrderStatus[] = [
    "new",
    "in_progress",
    "contacted",
    "waiting_payment",
    "ready_for_delivery",
    "paid",
    "delivered",
    "cancelled",
  ];
  return allowed.includes(value as OrderStatus) ? (value as OrderStatus) : "new";
}

function parsePaymentStatus(value: string): "pending" | "paid" | "cancelled" {
  return value === "paid" || value === "cancelled" ? value : "pending";
}
