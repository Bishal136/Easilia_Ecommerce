import React, { useState, useRef } from "react";
import { getApiBaseUrl } from "../../utils/apiUrl";

export const ProductImageUpload = ({
  value,
  onChange,
  label = "Product Images (Gallery)",
  maxImages = 8,
  multiple = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Normalize value to an array of objects: [{ url, path, isThumbnail }]
  const normalizedImages = Array.isArray(value)
    ? value.map((img, idx) =>
        typeof img === "string"
          ? { url: img, path: "", isThumbnail: idx === 0 }
          : { ...img, isThumbnail: img.isThumbnail ?? idx === 0 }
      )
    : value?.url
    ? [{ url: value.url, path: value.path || "", isThumbnail: true }]
    : typeof value === "string" && value
    ? [{ url: value, path: "", isThumbnail: true }]
    : [];

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    // Check count limit
    if (normalizedImages.length + files.length > maxImages) {
      setErrorMsg(`You can upload a maximum of ${maxImages} images.`);
      return;
    }

    const maxImageSizeMB = Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB) || 15;

    // Validate mime types and sizes
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please select valid image files (PNG, JPG, WEBP, GIF).");
        return;
      }
      if (file.size > maxImageSizeMB * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the ${maxImageSizeMB}MB size limit.`);
        return;
      }
    }

    setErrorMsg("");
    setIsUploading(true);

    try {
      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const apiUrl = `${getApiBaseUrl()}/upload/images`;

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data?.data?.files && data.data.files.length > 0) {
        const uploadedList = data.data.files.map((f, idx) => ({
          url: f.url,
          path: f.path || "",
          isThumbnail: normalizedImages.length === 0 && idx === 0,
        }));

        if (multiple) {
          onChange([...normalizedImages, ...uploadedList]);
        } else {
          onChange(uploadedList[0]);
        }
      } else {
        // Fallback: Use FileReader to convert all selected files to base64 Data URLs
        const localList = await Promise.all(
          Array.from(files).map(
            (file, idx) =>
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) =>
                  resolve({
                    url: e.target.result,
                    path: "",
                    isThumbnail: normalizedImages.length === 0 && idx === 0,
                  });
                reader.readAsDataURL(file);
              })
          )
        );

        if (multiple) {
          onChange([...normalizedImages, ...localList]);
        } else {
          onChange(localList[0]);
        }
      }
    } catch {
      // Offline fallback
      const localList = await Promise.all(
        Array.from(files).map(
          (file, idx) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) =>
                resolve({
                  url: e.target.result,
                  path: "",
                  isThumbnail: normalizedImages.length === 0 && idx === 0,
                });
              reader.readAsDataURL(file);
            })
        )
      );

      if (multiple) {
        onChange([...normalizedImages, ...localList]);
      } else {
        onChange(localList[0]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleRemoveImage = (indexToRemove, e) => {
    e.stopPropagation();
    const updated = normalizedImages.filter((_, idx) => idx !== indexToRemove);
    // If the removed image was the thumbnail, set the new first image as thumbnail
    if (updated.length > 0 && !updated.some((img) => img.isThumbnail)) {
      updated[0].isThumbnail = true;
    }
    onChange(multiple ? updated : updated[0] || null);
  };

  const handleSetMainThumbnail = (indexToSet, e) => {
    e.stopPropagation();
    const updated = normalizedImages.map((img, idx) => ({
      ...img,
      isThumbnail: idx === indexToSet,
    }));
    // Reorder so that thumbnail is first in array
    const [selected] = updated.splice(indexToSet, 1);
    updated.unshift(selected);
    onChange(multiple ? updated : updated[0]);
  };

  return (
    <div className="space-y-2">
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} *
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            ({normalizedImages.length}/{maxImages} images)
          </span>
        </div>
        {isUploading && (
          <span className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-ping" />
            Uploading photos...
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Gallery Grid + Upload Tile */}
      <div className="space-y-3">
        {normalizedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
            {normalizedImages.map((img, idx) => (
              <div
                key={idx}
                className={`relative group rounded-xl overflow-hidden border transition-all aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${
                  img.isThumbnail
                    ? "ring-2 ring-fuchsia-500 border-fuchsia-500 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Product view ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80";
                  }}
                />

                {/* Primary Thumbnail Badge */}
                {img.isThumbnail ? (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-fuchsia-600 text-white shadow-xs">
                    ★ Main Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSetMainThumbnail(idx, e)}
                    className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-slate-200 hover:bg-fuchsia-600 hover:text-white cursor-pointer shadow-xs"
                    title="Set as Main Cover Image"
                  >
                    Set as Main
                  </button>
                )}

                {/* Delete / Remove Button */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveImage(idx, e)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                  title="Remove this image"
                >
                  ✕
                </button>

                {/* Order Index Footer */}
                <span className="absolute bottom-1 right-1.5 text-[9px] font-mono font-bold text-white/90 bg-slate-950/60 px-1 rounded">
                  #{idx + 1}
                </span>
              </div>
            ))}

            {/* "+ Add More" Tile (when images exist but haven't reached max) */}
            {normalizedImages.length < maxImages && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-400 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-fuchsia-50/30 dark:hover:bg-fuchsia-950/20 aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-all p-2 text-center"
              >
                <span className="text-xl text-fuchsia-600 dark:text-fuchsia-400 font-bold">+</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Add Image
                </span>
                <span className="text-[9px] text-slate-400">Multi-select</span>
              </div>
            )}
          </div>
        )}

        {/* Big Drag & Drop Zone when NO images uploaded yet */}
        {normalizedImages.length === 0 && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-950/20"
                : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-850 hover:border-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center text-xl shadow-xs">
                📸
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select multiple product photos{" "}
                  <span className="font-normal text-slate-500">or drag and drop</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload up to {maxImages} high-resolution views (PNG, JPG, WEBP up to 5MB each)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageUpload;
