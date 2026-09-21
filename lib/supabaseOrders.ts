import { getSupabaseAdminClient } from "./supabaseProducts";

export type OrderStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "waiting_payment"
  | "ready_for_delivery"
  | "paid"
  | "delivered"
  | "cancelled";

export type OrderRecord = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  address: string;
  payment_method: string;
  payment_label: string;
  total: number;
  cart_description: string;
  cart_items: unknown;
  notes: string | null;
  internal_note: string | null;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "cancelled";
  created_at: string;
  updated_at?: string;
};

export type SaveOrderInput = {
  orderId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentLabel: string;
  total: number;
  cartDescription: string;
  cartItems: unknown;
  notes?: string;
};

// "duplicate" means the order id is already taken — the caller must retry with
// a new id. A plain insert (never upsert) guarantees an existing order can't be
// silently overwritten by a new one that happened to draw the same id.
export async function saveOrderRecord(
  order: SaveOrderInput
): Promise<"saved" | "duplicate" | "failed"> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return "failed";

  const { error } = await supabase.from("orders").insert(
    {
      id: order.orderId,
      customer_name: order.name,
      customer_email: order.email,
      customer_phone: order.phone,
      city: order.city,
      address: order.address,
      payment_method: order.paymentMethod,
      payment_label: order.paymentLabel,
      total: order.total,
      cart_description: order.cartDescription,
      cart_items: order.cartItems,
      notes: order.notes || null,
      status: "new",
      payment_status: "pending",
    }
  );

  if (error?.code === "23505") return "duplicate";
  if (error) {
    console.error("[supabase] failed to save order:", error);
    return "failed";
  }

  return "saved";
}

export async function getRecentOrders(limit = 50): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const query = supabase
    .from("orders")
    .select(
      "id,customer_name,customer_email,customer_phone,city,address,payment_method,payment_label,total,cart_description,cart_items,notes,internal_note,status,payment_status,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error && error.message.includes("internal_note")) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("orders")
      .select(
        "id,customer_name,customer_email,customer_phone,city,address,payment_method,payment_label,total,cart_description,cart_items,notes,status,payment_status,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fallbackError) {
      console.error("[supabase] failed to load orders:", fallbackError);
      return [];
    }

    return ((fallbackData || []) as Array<Omit<OrderRecord, "internal_note">>).map((order) => ({
      ...order,
      internal_note: null,
    }));
  }

  if (error) {
    console.error("[supabase] failed to load orders:", error);
    return [];
  }

  return (data || []) as OrderRecord[];
}

export async function updateOrderRecordStatus(
  id: string,
  status: OrderStatus,
  paymentStatus: "pending" | "paid" | "cancelled",
  internalNote?: string
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const update: {
    status: OrderStatus;
    payment_status: "pending" | "paid" | "cancelled";
    internal_note?: string | null;
  } = { status, payment_status: paymentStatus };

  if (internalNote !== undefined) {
    update.internal_note = internalNote.trim() || null;
  }

  const { error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id);

  if (error && error.message.includes("internal_note")) {
    const { error: fallbackError } = await supabase
      .from("orders")
      .update({ status, payment_status: paymentStatus })
      .eq("id", id);

    if (fallbackError) {
      console.error("[supabase] failed to update order:", fallbackError);
      return false;
    }

    return true;
  }

  if (error) {
    console.error("[supabase] failed to update order:", error);
    return false;
  }

  return true;
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "חדשה",
  in_progress: "בטיפול",
  contacted: "חזרנו ללקוח",
  waiting_payment: "מחכה לתשלום",
  ready_for_delivery: "מוכן למסירה",
  paid: "שולם",
  delivered: "נמסר",
  cancelled: "בוטלה",
};

export const paymentStatusLabels: Record<"pending" | "paid" | "cancelled", string> = {
  pending: "ממתין לתשלום",
  paid: "שולם",
  cancelled: "בוטל",
};
