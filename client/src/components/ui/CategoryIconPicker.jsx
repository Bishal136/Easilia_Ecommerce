import React, { useState } from "react";
import CategoryIcon from "./CategoryIcon";

export const CategoryIconPicker = ({ value, onChange, label = "Emoji / Icon" }) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState(false);

  // Copy icon to clipboard
  const handleCopy = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy icon:", err);
    }
  };

  // Paste icon from clipboard
  const handlePaste = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onChange(text.trim());
          setPasteFeedback(true);
          setTimeout(() => setPasteFeedback(false), 2000);
        }
      }
    } catch (err) {
      console.error("Clipboard read access blocked:", err);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label}
        </label>
        {copyFeedback && (
          <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
            ✓ Copied!
          </span>
        )}
        {pasteFeedback && (
          <span className="text-[10px] font-bold text-indigo-600 animate-fade-in">
            ✓ Pasted!
          </span>
        )}
      </div>

      {/* Clean, Streamlined Input Bar: Preview + Text Input + Copy + Paste */}
      <div className="flex items-center gap-1.5">
        {/* Preview box */}
        <div
          className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl text-purple-600 shadow-xs shrink-0 select-none"
          title="Icon preview"
        >
          <CategoryIcon icon={value} className="w-5 h-5" textClassName="text-xl" />
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. ⌨️, 💻, 📱, 👗..."
          className="flex-1 px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all font-medium"
        />

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
          title="Copy icon"
        >
          <span>📋</span>
          <span className="hidden sm:inline">Copy</span>
        </button>

        {/* Paste Button */}
        <button
          type="button"
          onClick={handlePaste}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
          title="Paste icon from clipboard"
        >
          <span>📥</span>
          <span className="hidden sm:inline">Paste</span>
        </button>

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
            title="Clear icon"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryIconPicker;
