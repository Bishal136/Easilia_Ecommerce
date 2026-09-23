import React from "react";
import { Truck, ShieldCheck, CreditCard, Headphones, RotateCcw } from "lucide-react";

export const StoreFeatures = () => {
  const features = [
    {
      icon: Truck,
      title: "Fast Express Delivery",
      description: "Free shipping on orders over ৳1,000 nationwide",
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white",
      badgeColor: "border-emerald-200 dark:border-emerald-800/40",
    },
    {
      icon: ShieldCheck,
      title: "100% Authentic Products",
      description: "Verified direct merchants & brand guarantee",
      colorClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white",
      badgeColor: "border-sky-200 dark:border-sky-800/40",
    },
    {
      icon: CreditCard,
      title: "Secure & Instant Payment",
      description: "bKash, Nagad, Visa, Cards & Cash on Delivery",
      colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white",
      badgeColor: "border-purple-200 dark:border-purple-800/40",
    },
    {
      icon: Headphones,
      title: "24/7 Priority Support",
      description: "Dedicated live chat assistance with merchants",
      colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white",
      badgeColor: "border-amber-200 dark:border-amber-800/40",
    },
    {
      icon: RotateCcw,
      title: "7-Day Easy Returns",
      description: "Hassle-free replacement & money-back policy",
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white",
      badgeColor: "border-rose-200 dark:border-rose-800/40",
    },
  ];

  return (
    <section aria-label="Platform Highlights & Features" className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none transition-all">
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-1 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 divide-y-0 sm:divide-y sm:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/70">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`group shrink-0 snap-start w-[210px] sm:w-auto flex items-center gap-3 p-2.5 sm:p-2 bg-slate-50/70 dark:bg-slate-800/50 sm:bg-transparent rounded-xl sm:rounded-none transition-transform duration-300 hover:scale-[1.02] ${
                  idx > 0 ? "lg:pl-5" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xs border ${feature.badgeColor} ${feature.colorClass}`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {feature.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StoreFeatures;
