import React from "react";
import { Link, useSearchParams } from "react-router-dom";

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD-" + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Confirmed!</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your order <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{orderId}</span> has been placed successfully and dispatched to merchants for preparation.
        </p>

        <div className="pt-4 flex flex-col gap-2">
          <Link
            to="/user/orders"
            className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            Track My Order
          </Link>
          <Link
            to="/"
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
