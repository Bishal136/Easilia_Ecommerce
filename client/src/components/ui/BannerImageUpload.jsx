import React, { useState, useRef } from "react";
import { getApiBaseUrl } from "../../utils/apiUrl";

export const BannerImageUpload = ({ value, onChange, label = "Banner Image" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file");
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
        onChange(data.data.file.url);
        showToast("✓ Image uploaded");
      } else {
        // Fallback to Base64 Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
          showToast("✓ Image attached");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target.result);
        showToast("✓ Image attached");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const currentImageUrl = typeof value === "string" ? value : value?.url || "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label} <span className="text-rose-500">*</span>
        </label>
        {toastMsg && (
          <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
            {toastMsg}
          </span>
        )}
      </div>

      {currentImageUrl ? (
        /* Image Attached Preview Bar */
        <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-300 rounded-xl">
          <div className="w-16 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
            <img
              src={currentImageUrl}
              alt="Banner Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://placehold.co/300x150?text=Banner+Image";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">
              Banner image attached
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {currentImageUrl.startsWith("data:") ? "Uploaded from computer" : currentImageUrl}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors shrink-0"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-purple-50/20 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-100/80 text-purple-600 mx-auto flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
            {isUploading ? "⏳" : "📁"}
          </div>
          <p className="text-xs font-bold text-slate-800">
            {isUploading ? "Uploading image..." : "Click or drag image here to upload"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Supports PNG, JPG, WEBP, or SVG (Max 5MB)
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default BannerImageUpload;
