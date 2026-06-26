import {
  orderStatusLabels,
  paymentStatusLabels,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/supabaseOrders";
import { updateOrderStatus } from "./actions";

const orderStatuses = Object.keys(orderStatusLabels) as OrderStatus[];
const paymentStatuses = Object.keys(paymentStatusLabels) as Array<"pending" | "paid" | "cancelled">;

export default function OrdersPanel({ orders }: { orders: OrderRecord[] }) {
  const activeOrders = orders
    .filter(isActiveOrder)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const pastOrders = orders
    .filter((order) => !isActiveOrder(order))
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  if (!orders.length) {
    return (
      <p className="rounded-3xl border border-line bg-white/75 p-6 text-muted">
        עדיין אין הזמנות שמורות במסד הנתונים.
      </p>
    );
  }

  return (
    <div className="grid gap-7">
      <section className="rounded-3xl border border-line bg-white/55 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-gold">תור הזמנות</p>
            <h3 className="mt-1 text-2xl font-semibold">לטיפול עכשיו</h3>
          </div>
          <p className="text-sm leading-6 text-muted">
            {activeOrders.length ? `${activeOrders.length} הזמנות ממתינות לפי סדר כניסה` : "אין כרגע הזמנות פתוחות"}
          </p>
        </div>

        {activeOrders.length ? (
          <div className="grid gap-4">
            {activeOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} queuePosition={index + 1} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-white p-5 text-muted">
            כל ההזמנות טופלו. כשנכנסת הזמנה חדשה היא תופיע כאן בראש התור הניהולי.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-white/55 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-gold">ארכיון</p>
            <h3 className="mt-1 text-2xl font-semibold">הזמנות עבר</h3>
          </div>
          <p className="text-sm leading-6 text-muted">
            הזמנות ששולמו, נמסרו או בוטלו נשמרות כאן למעקב.
          </p>
        </div>

        {pastOrders.length ? (
          <div className="grid gap-4">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} isPast />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-white p-5 text-muted">
            עדיין אין הזמנות עבר.
          </p>
        )}
      </section>
    </div>
  );
}

function OrderCard({
  order,
  queuePosition,
  isPast = false,
}: {
  order: OrderRecord;
  queuePosition?: number;
  isPast?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {queuePosition && (
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-cream">
                #{queuePosition} בתור
              </span>
            )}
            <p className="eyebrow text-gold">{order.id}</p>
            <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted">
              {orderStatusLabels[order.status]} · {paymentStatusLabels[order.payment_status]}
            </span>
          </div>
          <h3 className="mt-2 text-2xl font-semibold">{order.customer_name}</h3>
          <p className="mt-2 text-sm text-muted" dir="ltr">
            {order.customer_phone} · {order.customer_email}
          </p>
          <p className="mt-2 text-sm text-muted">
            {order.city}, {order.address}
          </p>
          <p className="mt-2 text-xs text-muted">
            נכנסה: {formatOrderDate(order.created_at)}
          </p>
        </div>

        <div className="rounded-2xl bg-cream px-5 py-4 text-left md:min-w-44">
          <p className="eyebrow text-right">סה״כ</p>
          <p className="mt-1 text-3xl font-bold">₪{order.total.toLocaleString("he-IL")}</p>
        </div>
      </div>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-line bg-white p-4 text-sm leading-7 text-muted">
        {order.cart_description}
        {order.notes ? `\n\nהערות: ${order.notes}` : ""}
      </div>

      {!isPast && (
        <div className="mt-5 flex flex-wrap gap-3">
          <QuickStatusButton order={order} label="סימון בטיפול" status="in_progress" paymentStatus={order.payment_status} />
          <QuickStatusButton order={order} label="חזרנו ללקוח" status="contacted" paymentStatus={order.payment_status} />
          <QuickStatusButton order={order} label="מחכה לתשלום" status="waiting_payment" paymentStatus="pending" />
          <QuickStatusButton order={order} label="מוכן למסירה" status="ready_for_delivery" paymentStatus={order.payment_status} />
          <QuickStatusButton order={order} label="סימון כשולם" status="paid" paymentStatus="paid" />
          <QuickStatusButton order={order} label="ביטול הזמנה" status="cancelled" paymentStatus="cancelled" variant="light" />
        </div>
      )}

      <form action={updateOrderStatus} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <input type="hidden" name="id" value={order.id} />
        <div>
          <label className="eyebrow mb-2 block">סטטוס הזמנה</label>
          <select
            name="status"
            defaultValue={order.status}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="eyebrow mb-2 block">סטטוס תשלום</label>
          <select
            name="paymentStatus"
            defaultValue={order.payment_status}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {paymentStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="eyebrow mb-2 block">הערה פנימית</label>
          <textarea
            name="internalNote"
            defaultValue={order.internal_note || ""}
            rows={3}
            placeholder="למשל: דיברנו בוואטסאפ, מחכה לאישור צבע, לא לשלוח לפני יום שישי..."
            className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <p className="mt-2 text-xs leading-6 text-muted">ההערה נשמרת רק באדמין ולא נשלחת ללקוח.</p>
        </div>

        <button type="submit" className="button-dark rounded-full px-5 py-3">
          עדכון
        </button>
      </form>
    </article>
  );
}

function QuickStatusButton({
  order,
  label,
  status,
  paymentStatus,
  variant = "dark",
}: {
  order: OrderRecord;
  label: string;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "cancelled";
  variant?: "dark" | "light";
}) {
  return (
    <form action={updateOrderStatus}>
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="paymentStatus" value={paymentStatus} />
      <button
        type="submit"
        className={
          variant === "dark"
            ? "button-dark rounded-full px-5 py-3 text-sm"
            : "button-light rounded-full px-5 py-3 text-sm"
        }
      >
        {label}
      </button>
    </form>
  );
}

function isActiveOrder(order: OrderRecord) {
  return !(
    order.payment_status === "paid" ||
    order.payment_status === "cancelled" ||
    order.status === "paid" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
