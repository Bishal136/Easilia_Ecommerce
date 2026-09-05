import React, { useState, useRef } from "react";
import CategoryIcon from "./CategoryIcon";
import { getApiBaseUrl } from "../../utils/apiUrl";

export const CategoryIconInput = ({
  iconValue,
  imageValue,
  onIconChange,
  onImageChange,
  label = "Category Icon / Image",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef(null);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showFeedback("Please choose an image file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const res = await fetch(`${getApiBaseUrl()}/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data?.data?.file?.url) {
        onImageChange({
          url: data.data.file.url,
          path: data.data.file.path || "",
        });
        showFeedback("✓ Image uploaded");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          onImageChange({ url: e.target.result, path: "" });
          showFeedback("✓ Image attached");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageChange({ url: e.target.result, path: "" });
        showFeedback("✓ Image attached");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Paste handler for both image and emoji
  const handlePaste = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    // 1. Try reading clipboard for Image blob or text
    try {
      if (navigator?.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith("image/"));
          if (imgType) {
            const blob = await item.getType(imgType);
            const file = new File([blob], `icon-${Date.now()}.png`, { type: imgType });
            await uploadFile(file);
            return;
          }
        }
      }

      // 2. Try text clipboard (emoji or image URL)
      if (navigator?.clipboard?.readText) {
        const text = (await navigator.clipboard.readText())?.trim();
        if (text) {
          if (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/")) {
            onImageChange({ url: text, path: "" });
            showFeedback("✓ Image URL pasted");
          } else {
            onIconChange(text);
            showFeedback("✓ Icon pasted");
          }
        }
      }
    } catch {
      showFeedback("Paste via Ctrl+V into the box");
    }
  };

  const handleContainerPaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          uploadFile(file);
          return;
        }
      }
    }

    const pastedText = e.clipboardData?.getData("text")?.trim();
    if (pastedText) {
      if (pastedText.startsWith("http://") || pastedText.startsWith("https://") || pastedText.startsWith("data:image/")) {
        e.preventDefault();
        onImageChange({ url: pastedText, path: "" });
        showFeedback("✓ Image URL attached");
      }
    }
  };

  const hasImage = Boolean(imageValue?.url || (typeof imageValue === "string" && imageValue));
  const currentImageUrl = imageValue?.url || (typeof imageValue === "string" ? imageValue : "");

  return (
    <div onPaste={handleContainerPaste} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label}
        </label>
        {feedback && (
          <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
            {feedback}
          </span>
        )}
      </div>

      {hasImage ? (
        /* Image Preview Box */
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <div className="w-8 h-8 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={currentImageUrl}
              alt="Category Icon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-800 block truncate">
              Image attached
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700 transition-colors"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onImageChange({ url: "", path: "" })}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      ) : (
        /* Emoji / Text Input + Image Upload & Paste Buttons */
        <div className="flex items-center gap-1.5">
          {/* Avatar Preview */}
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-lg text-purple-600 shrink-0 select-none shadow-xs">
            <CategoryIcon icon={iconValue} className="w-4 h-4" textClassName="text-base" />
          </div>

          {/* Text/Emoji Input */}
          <input
            type="text"
            value={iconValue || ""}
            onChange={(e) => onIconChange(e.target.value)}
            placeholder="e.g. ⌨️, 💻, 📱, 👗..."
            className="w-full min-w-0 flex-1 px-2.5 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
          />

          {/* Upload Image Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
            title="Upload image file"
          >
            <span>{isUploading ? "⏳" : "🖼️"}</span>
            <span className="hidden sm:inline">Image</span>
          </button>

          {/* Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
            title="Paste image or emoji from clipboard"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Paste</span>
          </button>

          {/* Clear */}
          {iconValue && (
            <button
              type="button"
              onClick={() => onIconChange("")}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default CategoryIconInput;
