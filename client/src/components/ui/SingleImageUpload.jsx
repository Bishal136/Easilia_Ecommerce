import React, { useState, useRef } from "react";

export const SingleImageUpload = ({
  label = "Upload Image",
  description = "",
  value = "",
  onChange,
  shape = "square", // "circle" | "square" | "banner"
  maxSizeMB = Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB) || 15,
}) => {
  const finalDescription = description || `Supports JPG, PNG, WEBP up to ${maxSizeMB}MB`;
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "url"
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const currentUrl = typeof value === "string" ? value : value?.url || "";

  const handleUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    setErrorMsg("");
    setIsUploading(true);

    try {
      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/upload/image`
        : "/api/v1/upload/image";

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data?.data?.file?.url) {
        onChange(data.data.file.url);
      } else {
        // Fallback to FileReader data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Local fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyUrl = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput("");
    setErrorMsg("");
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 font-sans">
      {/* Header with Label and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
            {label}
          </label>
          {finalDescription && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {finalDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              inputMode === "upload"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            📁 Upload
          </button>
          <button
            type="button"
            onClick={() => setInputMode("url")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              inputMode === "url"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            🔗 URL
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Mode: Paste URL */}
      {inputMode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Display & Upload Area */}
      {currentUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
          {shape === "circle" ? (
            <div className="w-28 h-28 my-3 rounded-full overflow-hidden border-2 border-fuchsia-500 shadow-md relative group">
              <img
                src={currentUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full bg-white/90 text-slate-900 hover:bg-white text-xs cursor-pointer"
                  title="Change Photo"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-xs cursor-pointer"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : shape === "banner" ? (
            <div className="w-full aspect-[21/9] sm:aspect-[3/1] max-h-48 relative overflow-hidden">
              <img
                src={currentUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-3 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 hover:bg-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  Change Banner
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video max-h-44 relative overflow-hidden flex items-center justify-center">
              <img
                src={currentUrl}
                alt={label}
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-3 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 hover:bg-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          onClick={() => {
            if (inputMode === "upload") {
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-fuchsia-500 bg-fuchsia-50/40 dark:bg-fuchsia-950/20"
              : "border-slate-300 dark:border-slate-700 hover:border-fuchsia-400 bg-white/50 dark:bg-slate-900/30 hover:bg-fuchsia-50/20"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className="text-3xl">
              {shape === "circle" ? "🖼️" : shape === "banner" ? "🏞️" : "📷"}
            </span>
            <p className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {isUploading
                ? "Uploading image..."
                : `Click or drag & drop to upload ${label.toLowerCase()}`}
            </p>
            <p className="text-[10px] text-slate-400">
              Supports JPG, PNG, WEBP up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleImageUpload;
