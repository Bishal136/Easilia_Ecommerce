import React from "react";
import { Link, useSearchParams } from "react-router-dom";

export const PaymentFailPage = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "The payment transaction was cancelled or declined by your financial institution.";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center text-3xl mx-auto">
          ✕
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Unsuccessful</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {reason}
        </p>

        <div className="pt-4 flex flex-col gap-2">
          <Link
            to="/checkout"
            className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            Retry Checkout
          </Link>
          <Link
            to="/cart"
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailPage;
