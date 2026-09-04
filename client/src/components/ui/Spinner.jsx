import React from "react";
import { cn } from "../../utils/cn";

export const Spinner = ({
  size = "md",
  className = "",
  fullScreen = false,
  text = "Loading Easilia...",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "rounded-full border-t-transparent border-fuchsia-600 animate-spin border-slate-200 dark:border-slate-700",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
        role="status"
        aria-label="loading"
      />
      {text && (
        <p className="text-xs font-medium tracking-wide text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
        <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-xl border border-white/40 dark:border-slate-800">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 w-full min-h-[160px]">
      {spinnerContent}
    </div>
  );
};

export default Spinner;
