"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-white/80 p-6 shadow-sm">
      <label htmlFor="admin-password" className="eyebrow mb-3 block">
        סיסמת ניהול
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        required
        className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-ink outline-none focus:border-ink"
      />
      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="button-dark mt-5 w-full rounded-full disabled:opacity-50">
        {pending ? "בודק..." : "כניסה"}
      </button>
    </form>
  );
}
