"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "../_actions/auth";

const items = [
  { href: "/admin/products", label: "תיקים", icon: "👜" },
  { href: "/admin/orders", label: "הזמנות", icon: "📦" },
  { href: "/admin/home", label: "דף הבית", icon: "🏠" },
];

// Three places, always visible: a bar at the top on a computer, and a bar at the
// bottom of the screen on a phone where it is under the thumb.
export default function AdminNav({ openOrders }: { openOrders: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="leading-tight">
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-gold">smadar heymans</span>
              <span className="block text-[17px] font-bold text-ink">ניהול האתר</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="ניווט ראשי">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-5 py-2.5 text-[14px] font-bold ${isActive(item.href) ? "bg-ink text-cream" : "text-ink hover:bg-white"}`}
                >
                  {item.label}
                  {item.href === "/admin/orders" && openOrders > 0 && (
                    <span className="mr-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] text-white">{openOrders}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink sm:block">
              לאתר ↗
            </Link>
            <form action={logoutAdmin}>
              <button type="submit" className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink">
                יציאה
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-line bg-cream/97 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="ניווט ראשי">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[12px] font-bold ${isActive(item.href) ? "text-ink" : "text-muted"}`}
          >
            <span className="text-[20px] leading-none">{item.icon}</span>
            {item.label}
            {item.href === "/admin/orders" && openOrders > 0 && (
              <span className="absolute right-[28%] top-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">{openOrders}</span>
            )}
            {isActive(item.href) && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-ink" />}
          </Link>
        ))}
      </nav>
    </>
  );
}
