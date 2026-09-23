import React, { useState, useEffect, useRef } from "react";
import Spinner from "../ui/Spinner";
import VideoPlayer from "../ui/VideoPlayer";
import { parseVideoUrl } from "../../utils/videoUtils";
import { getApiBaseUrl } from "../../utils/apiUrl";

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  categories = [],
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState("basic"); // "basic" | "pricing" | "media" | "variants"
  const [errorMsg, setErrorMsg] = useState("");

  // Tab 1: Basic Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);


  // Tab 2: Pricing & Stock
  const [basePrice, setBasePrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [totalStock, setTotalStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // Tab 3: Media (Images & Video)
  const [images, setImages] = useState([]);
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" | "url"
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const imageFileInputRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [videoInputMode, setVideoInputMode] = useState("upload"); // "upload" | "url"
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoSuccess, setVideoSuccess] = useState("");
  const videoFileInputRef = useRef(null);

  // Tab 4: Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [optionGroups, setOptionGroups] = useState([
    {
      id: "opt-1",
      name: "Color",
      values: [], // [{ name: "White", price: "", stock: "34", sku: "" }]
      inputValue: "",
      presets: ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"],
    },
  ]);

  // Populate when opening modal or editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setCategory(initialData.category?._id || initialData.category || categories[0]?._id || "");
      setDescription(initialData.description || "");
      setIsActive(initialData.isActive !== false);

      setBasePrice(initialData.basePrice ? initialData.basePrice.toString() : "");
      setDiscountPrice(initialData.discountPrice ? initialData.discountPrice.toString() : "");
      setTotalStock(initialData.totalStock ? initialData.totalStock.toString() : "0");
      setLowStockThreshold(initialData.lowStockThreshold ? initialData.lowStockThreshold.toString() : "5");

      const existingImages = Array.isArray(initialData.images)
        ? initialData.images.map((img, idx) =>
            typeof img === "string"
              ? { url: img, isThumbnail: idx === 0 }
              : { ...img, isThumbnail: img.isThumbnail ?? idx === 0 }
          )
        : [];
      setImages(existingImages);

      const existingVideos =
        Array.isArray(initialData.videos) && initialData.videos.length > 0
          ? initialData.videos
          : initialData.videoUrl
          ? [{ url: initialData.videoUrl, path: "" }]
          : [];
      setVideos(existingVideos);
      if (existingVideos.length > 0 && existingVideos[0]?.url) {
        setVideoUrlInput(existingVideos[0].url);
      } else {
        setVideoUrlInput("");
      }

      if (initialData.variants && initialData.variants.length > 0) {
        setHasVariants(true);

        // Group variants by attribute or create default option group
        const groupMap = {};
        initialData.variants.forEach((v) => {
          let groupName = "Option";
          if (v.attributes) {
            const keys = Object.keys(v.attributes);
            if (keys.length > 0) groupName = keys[0];
          }
          if (!groupMap[groupName]) {
            groupMap[groupName] = [];
          }
          groupMap[groupName].push({
            name: v.name,
            price: v.price !== undefined && v.price !== null ? v.price.toString() : "",
            stock: v.stock !== undefined && v.stock !== null ? v.stock.toString() : "0",
            sku: v.sku || "",
          });
        });

        const newGroups = Object.keys(groupMap).map((k, idx) => ({
          id: `opt-${idx + 1}`,
          name: k.charAt(0).toUpperCase() + k.slice(1),
          values: groupMap[k],
          inputValue: "",
          presets: k.toLowerCase().includes("color")
            ? ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"]
            : ["Small", "Medium", "Large", "XL"],
        }));

        setOptionGroups(newGroups.length > 0 ? newGroups : [
          {
            id: "opt-1",
            name: "Color",
            values: [],
            inputValue: "",
            presets: ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"],
          },
        ]);
      } else {
        setHasVariants(false);
        setOptionGroups([
          {
            id: "opt-1",
            name: "Color",
            values: [],
            inputValue: "",
            presets: ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"],
          },
        ]);
      }
    } else {
      // Defaults for brand new product
      setTitle("");
      setCategory(categories[0]?._id || "");
      setDescription("");
      setIsActive(true);
      setBasePrice("");
      setDiscountPrice("");
      setTotalStock("0");
      setLowStockThreshold("5");
      setImages([]);
      setVideos([]);
      setVideoUrlInput("");
      setHasVariants(false);
      setOptionGroups([
        {
          id: "opt-1",
          name: "Color",
          values: [],
          inputValue: "",
          presets: ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"],
        },
      ]);
    }
    setActiveTab("basic");
    setErrorMsg("");
    setVideoError("");
    setVideoSuccess("");
  }, [initialData, categories, isOpen]);

  // Image Upload Handlers
  const handleUploadImages = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    setErrorMsg("");

    try {
      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const apiUrl = `${getApiBaseUrl()}/upload/images`;

      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data?.data?.files) {
        const newImages = data.data.files.map((f, idx) => ({
          url: f.url,
          path: f.path || "",
          isThumbnail: images.length === 0 && idx === 0,
        }));
        setImages((prev) => [...prev, ...newImages]);
      } else {
        const local = await Promise.all(
          Array.from(files).map(
            (file, idx) =>
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) =>
                  resolve({
                    url: e.target.result,
                    path: "",
                    isThumbnail: images.length === 0 && idx === 0,
                  });
                reader.readAsDataURL(file);
              })
          )
        );
        setImages((prev) => [...prev, ...local]);
      }
    } catch {
      const local = await Promise.all(
        Array.from(files).map(
          (file, idx) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) =>
                resolve({
                  url: e.target.result,
                  path: "",
                  isThumbnail: images.length === 0 && idx === 0,
                });
              reader.readAsDataURL(file);
            })
        )
      );
      setImages((prev) => [...prev, ...local]);
    } finally {
      setIsUploadingImages(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const handlePasteImageUrl = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: imageUrlInput.trim(),
        path: "",
        isThumbnail: prev.length === 0,
      },
    ]);
    setImageUrlInput("");
  };

  const handleSetMainThumbnail = (index) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isThumbnail: i === index,
      }))
    );
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isThumbnail)) {
        updated[0].isThumbnail = true;
      }
      return updated;
    });
  };

  // Video Upload Handlers
  const handleUploadVideo = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setVideoError("");
    setVideoSuccess("");
    setErrorMsg("");

    const maxVideoSizeMB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB) || 250;

    // 1. Client-side size validation
    if (file.size > maxVideoSizeMB * 1024 * 1024) {
      const msg = `Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${maxVideoSizeMB}MB limit. Please choose a smaller video or attach a video link.`;
      setVideoError(msg);
      setErrorMsg(msg);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      return;
    }

    // 2. Client-side type validation
    const isVideo =
      !file.type ||
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|mkv|avi|m4v|3gp|wmv|flv|mpg|mpeg|ts|ogv)$/i.test(file.name);
    if (!isVideo) {
      const msg = "Please select a valid video file (MP4, WebM, MOV, MKV, AVI, etc.).";
      setVideoError(msg);
      setErrorMsg(msg);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      return;
    }

    setIsUploadingVideo(true);

    try {
      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const apiUrl = `${getApiBaseUrl()}/upload/video`;

      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      const uploadedFile = data?.data?.file || data?.file;

      if (res.ok && uploadedFile?.url) {
        const uploadedUrl = uploadedFile.url;
        setVideos([{ url: uploadedUrl, path: uploadedFile.path || "" }]);
        setVideoUrlInput(uploadedUrl);
        setVideoError("");
        setVideoSuccess("Video uploaded successfully!");
      } else {
        const errorText =
          data?.message ||
          "Failed to upload video to server. Please verify the format or use a video link.";
        setVideoError(errorText);
        setErrorMsg(errorText);
      }
    } catch (err) {
      const errorText =
        err?.message ||
        "Network error while uploading video to server. Please ensure backend server is running.";
      setVideoError(errorText);
      setErrorMsg(errorText);
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  };

  const handlePasteVideoUrl = (customVal) => {
    const targetUrl = typeof customVal === "string" ? customVal.trim() : videoUrlInput.trim();
    if (!targetUrl) return;
    setVideos([{ url: targetUrl, path: "", isThumbnail: false }]);
    setVideoUrlInput(targetUrl);
  };

  // Variant Option Group Handlers
  const handleAddQuickOption = (type) => {
    setHasVariants(true);
    const presetsMap = {
      color: {
        name: "Color",
        presets: ["Black", "White", "Red", "Blue", "Green", "Navy", "Gray", "Yellow", "Pink", "Purple"],
      },
      clothing: {
        name: "Clothing Size",
        presets: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Free Size"],
      },
      shoe: {
        name: "Shoe Size",
        presets: ["38", "39", "40", "41", "42", "43", "44", "45"],
      },
      storage: {
        name: "Storage",
        presets: ["64GB", "128GB", "256GB", "512GB", "1TB"],
      },
      custom: {
        name: "Custom Option",
        presets: ["Standard", "Deluxe", "Bundle"],
      },
    };

    const config = presetsMap[type] || presetsMap.custom;
    const newGroup = {
      id: `opt-${Date.now()}`,
      name: config.name,
      values: [],
      inputValue: "",
      presets: config.presets,
    };
    setOptionGroups((prev) => [...prev, newGroup]);
  };

  const handleAddValueToGroup = (groupId, valName) => {
    const trimmed = valName.trim();
    if (!trimmed) return;
    setOptionGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          if (g.values.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
            return { ...g, inputValue: "" };
          }
          const defaultStock = totalStock && Number(totalStock) > 0 ? totalStock : "34";
          return {
            ...g,
            values: [
              ...g.values,
              {
                name: trimmed,
                price: "",
                stock: defaultStock,
                sku: "",
              },
            ],
            inputValue: "",
          };
        }
        return g;
      })
    );
  };

  const handleUpdateValueField = (groupId, valName, field, newVal) => {
    setOptionGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            values: g.values.map((item) =>
              item.name === valName ? { ...item, [field]: newVal } : item
            ),
          };
        }
        return g;
      })
    );
  };

  const handleRemoveValueFromGroup = (groupId, valNameToRemove) => {
    setOptionGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            values: g.values.filter((v) => v.name !== valNameToRemove),
          };
        }
        return g;
      })
    );
  };

  const handleRemoveGroup = (groupId) => {
    setOptionGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  // Total count of configured variant rows
  const totalVariantsCount = optionGroups.reduce((acc, g) => acc + g.values.length, 0);

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setActiveTab("basic");
      setErrorMsg("Product Title is required.");
      return;
    }
    if (!category) {
      setActiveTab("basic");
      setErrorMsg("Please select a Category.");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      setActiveTab("pricing");
      setErrorMsg("Regular Price must be greater than 0.");
      return;
    }

    const validImages =
      images.length > 0
        ? images
        : [
            {
              url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
              isThumbnail: true,
            },
          ];

    // Compile videos: prioritize direct input if typed or attached
    let finalVideos = [...videos];
    if (videoUrlInput && videoUrlInput.trim()) {
      const existing = videos.find((v) => v.url === videoUrlInput.trim());
      finalVideos = [
        {
          url: videoUrlInput.trim(),
          path: existing?.path || "",
          isThumbnail: false,
        },
      ];
    }

    // Compile variants array from option groups
    let compiledVariants = [];
    if (hasVariants) {
      optionGroups.forEach((group) => {
        group.values.forEach((v) => {
          const varPrice =
            v.price !== "" && v.price !== undefined
              ? Number(v.price)
              : Number(basePrice) || 0;
          const varStock =
            v.stock !== "" && v.stock !== undefined
              ? Number(v.stock)
              : Number(totalStock) || 0;
          const varSku =
            v.sku || `${title.slice(0, 3).toUpperCase()}-${v.name.replace(/\s+/g, "").toUpperCase()}`;

          let calculatedVarDiscount = undefined;
          if (discountPrice && Number(discountPrice) > 0 && Number(basePrice) > 0) {
            const ratio = Number(discountPrice) / Number(basePrice);
            if (ratio < 1) {
              calculatedVarDiscount = Math.round(varPrice * ratio);
            }
          }

          compiledVariants.push({
            name: v.name,
            sku: varSku,
            price: varPrice,
            discountPrice: calculatedVarDiscount,
            stock: varStock,
            attributes: {
              [group.name.toLowerCase()]: v.name,
            },
          });
        });
      });
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || title.trim(),
      category,
      basePrice: Number(basePrice),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      totalStock: Number(totalStock) || 0,
      isActive,
      images: validImages,
      videos: finalVideos.length > 0 ? finalVideos : [],
      variants: compiledVariants,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131B2E] w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0F172A]">
          <div className="max-w-[85%]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {initialData ? `Edit Product: ${initialData.title}` : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure catalog details, pricing, inventory stock, and media
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher Navigation Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 pt-2.5 sm:pt-3 gap-1.5 sm:gap-2 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto scrollbar-none">
          {[
            { id: "basic", label: "Basic Info", icon: "📝" },
            { id: "pricing", label: "Pricing & Stock", icon: "💰" },
            { id: "media", label: `Media (${images.length} img${(videos.length > 0 || videoUrlInput) ? " + 🎬" : ""})`, icon: "📸" },
            { id: "variants", label: `Variants (${hasVariants ? totalVariantsCount : 0})`, icon: "🎨" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: BASIC INFO                                                         */}
          {/* ========================================================================= */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Product Title *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wireless Bluetooth Noise-Cancelling Headphones"
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Category Dropdown Selection Only */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Category *
                </label>
                <div className="relative">
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer pr-10 font-medium"
                  >
                    <option value="" disabled>
                      Select category...
                    </option>
                    {categories.map((c) => {
                      const parentName =
                        typeof c.parent === "object" && c.parent?.name
                          ? c.parent.name
                          : null;
                      return (
                        <option key={c._id} value={c._id}>
                          {parentName ? `${parentName} → ${c.name}` : c.name}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product, highlight specifications, warranty, and key features..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="publishLiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="publishLiveCheck"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Publish and make visible to shoppers immediately
                </label>
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB 2: PRICING & STOCK                                                    */}
          {/* ========================================================================= */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Regular Price (৳) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Compare-at Price / MRP (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Optional original price"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Base Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalStock}
                    onChange={(e) => setTotalStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MEDIA (IMAGES & VIDEO)                                             */}
          {/* ========================================================================= */}
          {activeTab === "media" && (
            <div className="space-y-6">
              {/* Product Images Box */}
              <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Product Images
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload photos from your computer or paste image links.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        imageInputMode === "upload"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        imageInputMode === "url"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      🔗 Paste URL
                    </button>
                  </div>
                </div>

                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleUploadImages(e.target.files)}
                  className="hidden"
                />

                {imageInputMode === "url" ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/product-image.jpg"
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handlePasteImageUrl}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs cursor-pointer"
                    >
                      Add Image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageFileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-400/60 dark:border-indigo-500/40 rounded-2xl p-6 text-center cursor-pointer bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-2xl">📸</span>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {isUploadingImages ? "Uploading..." : "Click to select and upload images"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports JPG, PNG, WebP up to 10MB each. Multiple selection allowed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Images Grid */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border aspect-square bg-white dark:bg-slate-800 ${
                          img.isThumbnail ? "ring-2 ring-indigo-600 border-indigo-600" : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <img src={img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        {img.isThumbnail ? (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-600 text-white shadow-xs">
                            ★ Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainThumbnail(idx)}
                            className="absolute top-1 left-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-900/80 hover:bg-indigo-600 text-white cursor-pointer shadow-xs"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-[10px] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No images added yet.</p>
                )}
              </div>

              {/* Product Video Box */}
              <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🎬</span>
                      <span>Product Video</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload a video demo (Cloudinary/Server) or embed a YouTube / Vimeo link.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoInputMode("upload");
                        setVideoError("");
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        videoInputMode === "upload"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📁 Upload Video
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoInputMode("url");
                        setVideoError("");
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        videoInputMode === "url"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      🔗 Video Link
                    </button>
                  </div>
                </div>

                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleUploadVideo(e.target.files)}
                  className="hidden"
                />

                {videoInputMode === "url" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVideoUrlInput(val);
                          setVideoError("");
                          if (val.trim()) {
                            setVideos([{ url: val.trim(), path: "", isThumbnail: false }]);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handlePasteVideoUrl(videoUrlInput);
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handlePasteVideoUrl(videoUrlInput)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        Attach Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (videoFileInputRef.current) {
                        videoFileInputRef.current.value = "";
                      }
                      videoFileInputRef.current?.click();
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      isUploadingVideo
                        ? "border-purple-400 bg-purple-50/20 dark:bg-purple-950/20 pointer-events-none opacity-80"
                        : "border-purple-400/60 dark:border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/40"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-2xl">{isUploadingVideo ? "⏳" : "📹"}</span>
                      <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {isUploadingVideo ? "Uploading Video to Server..." : "Click to select and upload video"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isUploadingVideo
                          ? "Please wait while your video file is being uploaded..."
                          : "Supports MP4, WebM, MOV, MKV, AVI, etc. up to 250MB."}
                      </p>
                    </div>
                  </div>
                )}

                {/* In-Place Video Error Banner */}
                {videoError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Video Upload Issue</p>
                      <p className="text-[11px] opacity-90 mt-0.5 break-words">{videoError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoError("")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* In-Place Video Success Banner */}
                {videoSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">✅</span>
                      <p className="font-semibold truncate">{videoSuccess}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoSuccess("")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Attached Video Card & Player Preview */}
                {videos.length > 0 && videos[0]?.url ? (

                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">🎬</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {videos[0].url.includes("youtube") || videos[0].url.includes("youtu.be")
                              ? "YouTube Video Link"
                              : videos[0].url.includes("vimeo")
                              ? "Vimeo Video Link"
                              : "Uploaded Video File"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {videos[0].url}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVideos([]);
                          setVideoUrlInput("");
                          setVideoError("");
                          setVideoSuccess("");
                        }}
                        className="text-xs text-rose-500 font-bold hover:underline shrink-0 ml-3 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Interactive Video Player Preview */}
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <VideoPlayer url={videos[0].url} className="max-h-[260px]" />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No video attached yet.</p>
                )}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB 4: VARIANTS                                                           */}
          {/* ========================================================================= */}
          {activeTab === "variants" && (
            <div className="space-y-5">
              {/* Variants Enable Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Product Variants
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enable variations if this item comes in different colors, sizes, materials, or specifications.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {hasVariants && (
                <div className="space-y-5">
                  {/* Quick Add Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">Quick Add:</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuickOption("color")}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    >
                      + Color Option
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickOption("clothing")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    >
                      + Clothing Size
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickOption("shoe")}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 font-semibold text-[11px] border border-sky-200 dark:border-sky-800 cursor-pointer"
                    >
                      + Shoe Size
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickOption("storage")}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 font-semibold text-[11px] border border-purple-200 dark:border-purple-800 cursor-pointer"
                    >
                      + Storage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickOption("custom")}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Custom Option
                    </button>
                  </div>

                  {/* Option Groups */}
                  {optionGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5"
                    >
                      {/* Option Group Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase text-slate-500">
                            OPTION NAME:
                          </span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) =>
                              setOptionGroups((prev) =>
                                prev.map((g) => (g.id === group.id ? { ...g, name: e.target.value } : g))
                              )
                            }
                            className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500 px-1 py-0.5"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(group.id)}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          ✕ Remove Group
                        </button>
                      </div>

                      {/* Add Presets */}
                      {group.presets && group.presets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Add preset:</span>
                          {group.presets.map((preset) => {
                            const isAdded = group.values.some(
                              (v) => v.name.toLowerCase() === preset.toLowerCase()
                            );
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  isAdded
                                    ? handleRemoveValueFromGroup(group.id, preset)
                                    : handleAddValueToGroup(group.id, preset)
                                }
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                                  isAdded
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400"
                                }`}
                              >
                                {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Custom Value Add Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={group.inputValue || ""}
                          onChange={(e) =>
                            setOptionGroups((prev) =>
                              prev.map((g) => (g.id === group.id ? { ...g, inputValue: e.target.value } : g))
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddValueToGroup(group.id, group.inputValue);
                            }
                          }}
                          placeholder="Type option value (e.g. Midnight Blue) and press Add"
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddValueToGroup(group.id, group.inputValue)}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-500/70 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Add Value
                        </button>
                      </div>

                      {/* Option Values Table (Option | Specific Price | Stock | SKU | ✕) */}
                      {group.values.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full min-w-[480px] text-xs text-left">
                            <thead className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="px-4 py-2.5">Option</th>
                                <th className="px-4 py-2.5">Specific Price (৳)</th>
                                <th className="px-4 py-2.5">Stock</th>
                                <th className="px-4 py-2.5">SKU (Optional)</th>
                                <th className="px-4 py-2.5 text-center w-10">✕</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0F172A]">
                              {group.values.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                  <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.price}
                                      onChange={(e) =>
                                        handleUpdateValueField(group.id, item.name, "price", e.target.value)
                                      }
                                      placeholder={basePrice ? `Base (৳${basePrice})` : "Base price"}
                                      className="w-full max-w-[140px] px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.stock}
                                      onChange={(e) =>
                                        handleUpdateValueField(group.id, item.name, "stock", e.target.value)
                                      }
                                      placeholder="0"
                                      className="w-full max-w-[100px] px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="text"
                                      value={item.sku}
                                      onChange={(e) =>
                                        handleUpdateValueField(group.id, item.name, "sku", e.target.value)
                                      }
                                      placeholder="SKU-XXX"
                                      className="w-full max-w-[140px] px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveValueFromGroup(group.id, item.name)}
                                      className="text-rose-500 hover:text-rose-700 font-bold text-sm cursor-pointer"
                                      title="Remove option"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">No option values added yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls with Step Navigation */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sticky bottom-0 bg-white dark:bg-[#131B2E] z-10">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "variants") setActiveTab("media");
                    else if (activeTab === "media") setActiveTab("pricing");
                    else if (activeTab === "pricing") setActiveTab("basic");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
              {activeTab !== "variants" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "basic") setActiveTab("pricing");
                    else if (activeTab === "pricing") setActiveTab("media");
                    else if (activeTab === "media") setActiveTab("variants");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Next Step →
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Spinner size="xs" />
                    Saving...
                  </span>
                ) : initialData ? (
                  "Save Changes"
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;

