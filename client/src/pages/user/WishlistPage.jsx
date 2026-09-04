import React from "react";
import { Link } from "react-router-dom";

export const WishlistPage = () => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Saved Wishlist</h1>
            <p className="text-xs text-slate-500 mt-0.5">Keep track of items you plan to purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              title: "Wireless Noise-Cancelling Headphones",
              price: "৳4,500",
              slug: "wireless-headphones",
            },
            {
              id: 2,
              title: "Smart Fitness Tracker Band 7",
              price: "৳2,890",
              slug: "fitness-tracker",
            },
          ].map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between"
            >
              <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-3xl">
                🎧
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h3>
              <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {item.price}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/products/${item.slug}`}
                  className="flex-1 text-center py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  View Item
                </Link>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
