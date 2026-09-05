import React, { useState, useRef } from "react";
import { getApiBaseUrl } from "../../utils/apiUrl";

export const CategoryImageUpload = ({ value, onChange, label = "Category Image" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Upload file to backend server
  const uploadImageFile = async (file) => {
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
        onChange({
          url: data.data.file.url,
          path: data.data.file.path || "",
        });
        showToast("✓ Image uploaded");
      } else {
        // Fallback to local Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange({ url: e.target.result, path: "" });
          showToast("✓ Image attached");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange({ url: e.target.result, path: "" });
        showToast("✓ Image attached");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange({ url: urlInput.trim(), path: "" });
    setUrlInput("");
    setShowUrlInput(false);
    showToast("✓ Image URL applied");
  };

  const currentImageUrl = value?.url || (typeof value === "string" ? value : "");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label}
        </label>
        {toastMsg && (
          <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
            {toastMsg}
          </span>
        )}
      </div>

      {currentImageUrl ? (
        /* Image Attached Preview Bar */
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-300 rounded-lg">
          <div className="w-9 h-9 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
            <img
              src={currentImageUrl}
              alt="Category Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://placehold.co/100x100?text=Image";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">
              Image attached
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {currentImageUrl.startsWith("data:") ? "Local Image" : currentImageUrl}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 transition-colors shrink-0"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onChange({ url: "", path: "" })}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors shrink-0"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      ) : (
        /* Clean Upload Input Field */
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-3 py-2 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <span>{isUploading ? "⏳" : "📁"}</span>
            <span>{isUploading ? "Uploading Image..." : "Upload Image"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border shadow-xs transition-colors shrink-0 ${
              showUrlInput
                ? "bg-purple-100 border-purple-300 text-purple-700"
                : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
            title="Enter image URL"
          >
            🔗 URL
          </button>
        </div>
      )}

      {/* Direct URL Input Dialog */}
      {!currentImageUrl && showUrlInput && (
        <div className="flex gap-1.5 pt-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/category-image.png"
            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
          >
            Apply
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadImageFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default CategoryImageUpload;
