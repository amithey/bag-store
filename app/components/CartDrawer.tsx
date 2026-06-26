"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { submitOrder, type OrderState } from "../actions/orders";
import { ALLOWED_CITIES, SMADAR_PHONE_DISPLAY } from "@/lib/orderConstants";

const initialState: OrderState = { status: "idle" };
const inputClass =
  "w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[14px] outline-none transition focus:border-ink focus:bg-white";

export default function CartDrawer({ trustNote }: { trustNote: string }) {
  const {
    cartItems,
    isOpen,
    setIsOpen,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [mode, setMode] = useState<"cart" | "checkout" | "success">("cart");
  const [state, formAction, pending] = useActionState(submitOrder, initialState);

  useEffect(() => {
    if (state.status === "success") setMode("success");
  }, [state]);

  useEffect(() => {
    const openCheckout = () => {
      setIsOpen(true);
      setMode("checkout");
    };
    window.addEventListener("smadar:checkout", openCheckout);
    return () => window.removeEventListener("smadar:checkout", openCheckout);
  }, [setIsOpen]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setMode("cart"), 420);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[100] bg-ink/58 backdrop-blur-md"
          />

          <motion.aside
            data-lenis-prevent
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 210 }}
            className="fixed bottom-0 left-0 top-0 z-[101] flex h-[100dvh] w-full flex-col bg-cream text-ink shadow-2xl sm:w-[500px]"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="eyebrow">
                  {mode === "cart" && "סל קניות"}
                  {mode === "checkout" && "פרטי הזמנה"}
                  {mode === "success" && "הזמנה נשלחה"}
                </p>
                <h2 className="mt-1 text-[28px] font-semibold">
                  {mode === "cart" && `${cartItems.length} פריטים`}
                  {mode === "checkout" && "תיאום מסירה ותשלום"}
                  {mode === "success" && "תודה רבה"}
                </h2>
              </div>
              <button
                onClick={close}
                className="rounded-full border border-line bg-white px-4 py-2 text-[12px] font-bold"
              >
                סגור
              </button>
            </div>

            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 py-6"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {mode === "cart" && (
                cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-[22px] font-semibold">הסל ריק כרגע.</p>
                    <button onClick={close} className="button-dark mt-6 rounded-full">
                      חזרה לקולקציה
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {cartItems.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="rounded-[22px] border border-line bg-white/65 p-4">
                        <div className="flex gap-4">
                          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-bone">
                            <Image
                              src={item.product.image}
                              alt={item.product.alt}
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-[18px] font-semibold leading-tight">
                                  {item.product.name.split(" | ")[0]}
                                </h3>
                                <span className="font-bold">{item.product.price}</span>
                              </div>
                              <p className="mt-1 text-[13px] leading-6 text-muted">{item.product.material}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center rounded-full border border-line bg-cream">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.engraving, item.quantity - 1)}
                                  className="px-3 py-1 font-bold"
                                >
                                  -
                                </button>
                                <span className="px-2 text-[13px] font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.engraving, item.quantity + 1)}
                                  className="px-3 py-1 font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.product.id, item.engraving)}
                                className="text-[12px] font-bold text-muted hover:text-ink"
                              >
                                הסרה
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {mode === "checkout" && (
                <form id="checkout-form" action={formAction} className="space-y-4 pb-6">
                  <input
                    type="hidden"
                    name="cart"
                    value={JSON.stringify(
                      cartItems.map((i) => ({
                        product: { id: i.product.id, name: i.product.name, priceNum: i.product.priceNum },
                        quantity: i.quantity,
                        engraving: i.engraving,
                      }))
                    )}
                  />

                  <label className="block">
                    <span className="eyebrow mb-2 block">שם מלא</span>
                    <input name="name" required className={inputClass} />
                    {state.errors?.name && <span className="mt-1 block text-[12px] text-muted">{state.errors.name}</span>}
                  </label>

                  <label className="block">
                    <span className="eyebrow mb-2 block">אימייל לקבלת סיכום הזמנה</span>
                    <input name="email" type="email" required autoComplete="email" className={inputClass} />
                    {state.errors?.email && <span className="mt-1 block text-[12px] text-muted">{state.errors.email}</span>}
                  </label>

                  <label className="block">
                    <span className="eyebrow mb-2 block">טלפון לוואטסאפ</span>
                    <input name="phone" type="tel" required dir="ltr" placeholder="0501234567" className={inputClass} />
                    {state.errors?.phone && <span className="mt-1 block text-[12px] text-muted">{state.errors.phone}</span>}
                  </label>

                  <label className="block">
                    <span className="eyebrow mb-2 block">יישוב למסירה</span>
                    <select name="city" required defaultValue="" className={inputClass}>
                      <option value="" disabled>בחרו יישוב</option>
                      {ALLOWED_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {state.errors?.city && <span className="mt-1 block text-[12px] text-muted">{state.errors.city}</span>}
                  </label>

                  <label className="block">
                    <span className="eyebrow mb-2 block">כתובת</span>
                    <input name="address" required className={inputClass} />
                    {state.errors?.address && <span className="mt-1 block text-[12px] text-muted">{state.errors.address}</span>}
                  </label>

                  <p className="rounded-2xl border border-line bg-white/75 p-4 text-[13px] leading-7 text-muted">
                    {trustNote}
                  </p>

                  <div>
                    <span className="eyebrow mb-2 block">תשלום</span>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="rounded-2xl border border-line bg-white/70 p-4 text-[14px] font-bold">
                        <input type="radio" name="paymentMethod" value="bit" defaultChecked className="ml-2" />
                        ביט
                        <span dir="ltr" className="mt-1 block text-[12px] font-normal text-muted">{SMADAR_PHONE_DISPLAY}</span>
                      </label>
                      <label className="rounded-2xl border border-line bg-white/70 p-4 text-[14px] font-bold">
                        <input type="radio" name="paymentMethod" value="cash" className="ml-2" />
                        מזומן במסירה
                      </label>
                    </div>
                    <p className="mt-2 text-[12px] leading-6 text-muted">
                      האתר שולח את פרטי ההזמנה. התשלום עצמו נסגר רק אחרי אישור ותיאום.
                    </p>
                  </div>

                  <label className="block">
                    <span className="eyebrow mb-2 block">הערות</span>
                    <textarea name="notes" rows={3} className={`${inputClass} resize-none`} />
                  </label>

                  {state.status === "error" && state.message && (
                    <p className="text-[13px] text-muted">{state.message}</p>
                  )}
                </form>
              )}

              {mode === "success" && (
                <div className="flex min-h-full flex-col items-center justify-center text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-[28px] text-cream">✓</div>
                  <h3 className="mt-6 text-[30px] font-semibold">{state.message}</h3>
                  <p className="mt-3 text-[12px] font-bold tracking-[0.2em] text-gold">מספר הזמנה: {state.orderId}</p>
                  <p className="mt-5 max-w-sm text-[15px] leading-8 text-muted">
                    שלחנו סיכום הזמנה למייל שלך ולחנות. עכשיו אפשר להמשיך לתיאום בוואטסאפ.
                  </p>
                  {state.paymentLink && (
                    <a
                      href={state.paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream"
                    >
                      מעבר לתשלום בביט
                    </a>
                  )}
                  {state.whatsappLink && (
                    <a
                      href={state.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => clearCart()}
                      className="mt-3 w-full rounded-full bg-[#25D366] px-6 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white"
                    >
                      מעבר לוואטסאפ
                    </a>
                  )}
                </div>
              )}
            </div>

            {mode === "checkout" && (
              <div className="border-t border-line bg-white/85 px-6 py-5 backdrop-blur">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={pending}
                  className="button-dark w-full rounded-full disabled:opacity-50"
                >
                  {pending ? "שולח הזמנה..." : "שליחת הזמנה"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("cart")}
                  className="mt-3 w-full text-[12px] font-bold text-muted hover:text-ink"
                >
                  חזרה לסל
                </button>
              </div>
            )}

            {mode === "cart" && cartItems.length > 0 && (
              <div className="border-t border-line bg-white/60 px-6 py-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[14px] font-bold text-muted">סה״כ זמני</span>
                  <span className="text-[24px] font-bold">₪{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={() => setMode("checkout")} className="button-dark w-full rounded-full">
                  המשך לתיאום הזמנה
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
