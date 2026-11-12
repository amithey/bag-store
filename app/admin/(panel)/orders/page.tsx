import { getRecentOrders, type OrderRecord } from "@/lib/supabaseOrders";
import OrdersPanel from "../../OrdersPanel";
import { DatabaseDownNotice } from "../../_components/SetupBox";

export default async function OrdersPage() {
  let orders: OrderRecord[];
  try {
    orders = await getRecentOrders();
  } catch (error) {
    console.error("[admin] could not load orders:", error);
    return <DatabaseDownNotice />;
  }

  const open = orders.filter((order) => !isClosed(order));
  const thisMonth = orders.filter(isThisMonth);
  const paid = orders.filter((order) => order.payment_status === "paid");

  return (
    <div>
      <h1 className="text-[30px] font-semibold leading-tight md:text-[38px]">הזמנות</h1>
      <p className="mt-2 text-[14px] text-muted">הזמנות חדשות בראש, עם סימון מהיר של בטיפול, שולם או בוטל.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="ממתינות לטיפול" value={open.length} highlight />
        <Stat label="החודש" value={thisMonth.length} />
        <Stat label="שולמו" value={paid.length} />
      </div>

      <div className="mt-8">
        <OrdersPanel orders={orders} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${highlight ? "border-ink bg-ink text-cream" : "border-line bg-white/80"}`}>
      <p className="text-[12px] font-bold opacity-80">{label}</p>
      <p className="mt-1 text-[32px] font-bold leading-none">{value}</p>
    </div>
  );
}

function isClosed(order: OrderRecord) {
  return (
    order.payment_status === "paid" ||
    order.payment_status === "cancelled" ||
    order.status === "paid" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  );
}

function isThisMonth(order: OrderRecord) {
  const date = new Date(order.created_at);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
