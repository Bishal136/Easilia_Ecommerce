import React, { useState, useEffect, useMemo } from "react";
import {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from "../../features/banners/bannerApi";
import Spinner from "../../components/ui/Spinner";
import BannerImageUpload from "../../components/ui/BannerImageUpload";

const POSITION_OPTIONS = [
  { value: "home_hero", label: "Hero Carousel Slider", section: "hero" },
  { value: "promo_feature_1", label: "Top Feature: New Year New Fashion", section: "top" },
  { value: "promo_gaming", label: "Top: Gaming Accessories 4-Grid", section: "top" },
  { value: "promo_stack", label: "Top: 3-Card Stack (Winner/Redmi/TV)", section: "top" },
  { value: "promo_strip", label: "Row 2: 4-Banner Promo Strip", section: "strip" },
  { value: "promo_trend", label: "Trending Section: Men's Trend Collection", section: "trend" },
  { value: "promo_bestseller_grid", label: "Best Selling: 5-Card Collage Grid", section: "bestseller" },
  { value: "promo_bestseller_tall", label: "Best Selling: Tall Dog Food Banner", section: "bestseller" },
  { value: "home_middle", label: "Storefront Middle Banner", section: "other" },
  { value: "home_bottom", label: "Storefront Bottom Banner", section: "other" },
  { value: "ticker", label: "Top Announcement Ticker", section: "ticker" },
];

export const AdminBannersPage = () => {
  // Tabs matching Fig/Admin page/CMS & Banner.png
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "promotional" | "ticker" | "simulator"
  const [promoFilter, setPromoFilter] = useState("all");
  const [toast, setToast] = useState(null);

  // Announcement Ticker state
  const [tickerText, setTickerText] = useState("⚡ Special Deal: Free delivery on orders over ৳2,000! Use code DEALPORT");
  const [tickerLink, setTickerLink] = useState("/products");
  const [isTickerActive, setIsTickerActive] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    link: "/products",
    position: "home_hero",
    badge: "",
    priceTag: "",
    buttonText: "Shop Now",
    priority: 1,
    isActive: true,
  });

  // RTK Query API Hooks
  const { data: bannersData, isLoading, refetch } = useGetBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const rawBanners = useMemo(
    () => bannersData?.data?.banners || bannersData?.banners || [],
    [bannersData]
  );

  const heroBanners = useMemo(
    () => rawBanners.filter((b) => b.position === "home_hero"),
    [rawBanners]
  );

  const promotionalBanners = useMemo(
    () => rawBanners.filter((b) => b.position !== "home_hero" && b.position !== "ticker"),
    [rawBanners]
  );

  const tickerBanner = useMemo(
    () => rawBanners.find((b) => b.position === "ticker"),
    [rawBanners]
  );

  const activeBannersCount = useMemo(
    () => rawBanners.filter((b) => b.isActive).length,
    [rawBanners]
  );

  const [hasInitializedTicker, setHasInitializedTicker] = useState(false);

  useEffect(() => {
    if (tickerBanner && !hasInitializedTicker) {
      setTickerText(tickerBanner.title || "");
      setTickerLink(tickerBanner.link || "/products");
      setIsTickerActive(tickerBanner.isActive !== false);
      setHasInitializedTicker(true);
    }
  }, [tickerBanner, hasInitializedTicker]);

  const handleSaveTicker = async () => {
    if (!tickerText.trim()) {
      showToast("Please enter ticker message content", "error");
      return;
    }
    try {
      const payload = {
        title: tickerText.trim(),
        subtitle: "Storefront Announcement",
        image: { url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600", path: "" },
        link: tickerLink.trim() || "/products",
        position: "ticker",
        priority: 1,
        isActive: isTickerActive,
      };

      if (tickerBanner) {
        await updateBanner({ id: tickerBanner._id, ...payload }).unwrap();
      } else {
        await createBanner(payload).unwrap();
      }
      showToast("Announcement ticker saved successfully!");
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to save ticker", "error");
    }
  };

  const handleOpenAddModal = (defaultPos = "home_hero") => {
    setEditingBanner(null);
    setBannerForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      link: "/products",
      position: defaultPos,
      badge: "",
      priceTag: "",
      buttonText: "Shop Now",
      priority: heroBanners.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.image?.url || "",
      link: banner.link || "/products",
      position: banner.position || "home_hero",
      badge: banner.badge || "",
      priceTag: banner.priceTag || "",
      buttonText: banner.buttonText || "Shop Now",
      priority: banner.priority ?? 1,
      isActive: banner.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      showToast("Please provide a banner title", "error");
      return;
    }
    if (!bannerForm.imageUrl.trim()) {
      showToast("Please select or upload a banner image", "error");
      return;
    }

    try {
      const payload = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        image: { url: bannerForm.imageUrl.trim(), path: "" },
        link: bannerForm.link.trim() || "/products",
        position: bannerForm.position || "home_hero",
        badge: bannerForm.badge.trim(),
        priceTag: bannerForm.priceTag.trim(),
        buttonText: bannerForm.buttonText.trim() || "Shop Now",
        priority: Number(bannerForm.priority) || 1,
        isActive: bannerForm.isActive,
      };

      if (editingBanner) {
        await updateBanner({ id: editingBanner._id, ...payload }).unwrap();
        showToast(`Banner "${payload.title}" updated successfully!`);
      } else {
        await createBanner(payload).unwrap();
        showToast(`Banner "${payload.title}" created successfully!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to save banner", "error");
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      await updateBanner({
        id: banner._id,
        isActive: !banner.isActive,
      }).unwrap();
      showToast(`Banner is now ${!banner.isActive ? "Active" : "Disabled"}`);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to update status", "error");
    }
  };

  const handleDeleteBanner = async (banner) => {
    if (!window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;
    try {
      await deleteBanner(banner._id).unwrap();
      showToast(`Banner "${banner.title}" deleted successfully!`);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to delete banner", "error");
    }
  };

  const filteredPromoBanners = useMemo(() => {
    if (promoFilter === "all") return promotionalBanners;
    if (promoFilter === "top")
      return promotionalBanners.filter((b) =>
        ["promo_feature_1", "promo_gaming", "promo_stack"].includes(b.position)
      );
    if (promoFilter === "strip")
      return promotionalBanners.filter((b) => b.position === "promo_strip");
    if (promoFilter === "trend")
      return promotionalBanners.filter((b) => b.position === "promo_trend");
    if (promoFilter === "bestseller")
      return promotionalBanners.filter((b) =>
        ["promo_bestseller_grid", "promo_bestseller_tall"].includes(b.position)
      );
    return promotionalBanners.filter((b) => b.position === promoFilter);
  }, [promotionalBanners, promoFilter]);

  const getPositionLabel = (pos) => {
    const opt = POSITION_OPTIONS.find((o) => o.value === pos);
    return opt ? opt.label : pos;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Card Matching Figma Fig/Admin page/CMS & Banner.png */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
            🥞
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Homepage CMS & Banner Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control storefront hero sliders, promotional cards, and live announcement tickers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              refetch();
              showToast("Banners refreshed!");
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal("home_hero")}
            className="flex-1 sm:flex-initial px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>+</span>
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Top Metric Cards Matching Figma Fig/Admin page/CMS & Banner.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Banners */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              TOTAL BANNERS
            </span>
            <span className="text-sm">🖼️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{rawBanners.length}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {activeBannersCount} active live on store
            </div>
          </div>
        </div>

        {/* Hero Slider Slides */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              HERO SLIDER SLIDES
            </span>
            <span className="text-sm">🎛️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{heroBanners.length}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">
              Rotating carousel slides
            </div>
          </div>
        </div>

        {/* Announcement Ticker */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              ANNOUNCEMENT TICKER
            </span>
            <span className="text-sm">📢</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className={`w-2 h-2 rounded-full ${isTickerActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              <span>{isTickerActive ? "Live Active" : "Disabled"}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={tickerText}>
              {tickerText}
            </div>
          </div>
        </div>

        {/* Customer Clicks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              CUSTOMER CLICKS
            </span>
            <span className="text-sm">🎯</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">142</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">
              Storefront CTA interactions
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Matching Figma Fig/Admin page/CMS & Banner.png */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("hero")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "hero"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>✨</span>
            <span>Hero Carousel Slides ({heroBanners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("promotional")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "promotional"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🖼️</span>
            <span>Promotional Slots & Strips ({promotionalBanners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ticker")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "ticker"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📢</span>
            <span>Top Announcement Ticker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "simulator"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📱</span>
            <span>Live Storefront Simulator</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HERO CAROUSEL SLIDES                                               */}
        {/* ========================================================================= */}
        {activeTab === "hero" && (
          <div className="p-6 space-y-5">
            {/* Purple Banner Header */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <span>✨</span>
                  <span>Rotating Hero Banner Slider</span>
                </div>
                <p className="text-[11px] text-purple-700/80 mt-0.5">
                  Slides are shown in order at the top of the homepage. Use the up/down controls to reorder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal("home_hero")}
                className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                + Add Slide
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner size="md" text="Loading hero banners..." />
              </div>
            ) : heroBanners.length === 0 ? (
              /* Empty State matching Figma screenshot */
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
                  🖼️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Hero Slider Banners Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Add your first hero banner slide to showcase seasonal discounts or featured promotions on the storefront.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal("home_hero")}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  + Create First Slide
                </button>
              </div>
            ) : (
              /* Populated Hero Slides List */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heroBanners.map((slide, idx) => (
                  <div
                    key={slide._id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between group hover:border-purple-300 transition-all"
                  >
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={slide.image?.url}
                        alt={slide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end text-white">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded w-fit mb-1">
                          Priority: #{slide.priority ?? idx + 1}
                        </span>
                        <h4 className="font-bold text-sm truncate">{slide.title}</h4>
                        {slide.subtitle && (
                          <p className="text-xs text-slate-200 truncate mt-0.5">{slide.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            slide.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {slide.isActive ? "Active" : "Disabled"}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {slide.link}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(slide)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
                        >
                          {slide.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(slide)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(slide)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete slide"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROMOTIONAL SLOTS & STRIPS                                         */}
        {/* ========================================================================= */}
        {activeTab === "promotional" && (
          <div className="p-6 space-y-5">
            {/* Header with Slot Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Storefront Promotional Slots</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage featured cards, 4-banner strips, curated boxes, and best-seller collage slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal("promo_strip")}
                className="px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1"
              >
                <span>+</span>
                <span>Add Promotional Banner</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: "all", label: `All Slots (${promotionalBanners.length})` },
                { id: "top", label: "Top Feature & Stack" },
                { id: "strip", label: "4-Banner Promo Strip" },
                { id: "trend", label: "Trending Men's Box" },
                { id: "bestseller", label: "Best-Selling Collage & Tall" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPromoFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    promoFilter === f.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner size="md" text="Loading promotional banners..." />
              </div>
            ) : filteredPromoBanners.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <div className="text-2xl">🖼️</div>
                <div className="text-sm font-bold text-slate-800">No banners found in this slot</div>
                <p className="text-xs text-slate-400">
                  Click below to create a banner card for this promotional position.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal("promo_strip")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  + Add Banner
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPromoBanners.map((banner) => (
                  <div
                    key={banner._id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-purple-300 transition-all group"
                  >
                    <div className="relative h-36 bg-slate-900 overflow-hidden">
                      <img
                        src={banner.image?.url}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-600 text-white rounded-md shadow-xs">
                            {getPositionLabel(banner.position)}
                          </span>
                          {banner.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md shadow-xs">
                              {banner.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs truncate">{banner.title}</h4>
                          {banner.subtitle && (
                            <p className="text-[11px] text-slate-200 truncate mt-0.5">{banner.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              banner.isActive ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <span className="text-[11px] font-medium text-slate-600">
                            {banner.isActive ? "Active" : "Paused"}
                          </span>
                        </div>
                        {banner.buttonText && (
                          <span className="text-[10px] text-purple-600 font-semibold mt-0.5">
                            Button: {banner.buttonText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(banner)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] text-slate-700 font-medium cursor-pointer"
                        >
                          {banner.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(banner)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete banner"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TOP ANNOUNCEMENT TICKER                                            */}
        {/* ========================================================================= */}
        {activeTab === "ticker" && (
          <div className="p-6 max-w-2xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Announcement Top Bar Ticker</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays a prominent scrolling banner above the header across all store pages.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-800">
                Ticker Message Content
              </label>
              <input
                type="text"
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                placeholder="e.g. ⚡ Special Deal: Free delivery on orders over ৳2,000! Use code DEALPORT"
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Target Link / Action Route
              </label>
              <input
                type="text"
                value={tickerLink}
                onChange={(e) => setTickerLink(e.target.value)}
                placeholder="/products"
                className="w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="tickerToggle"
                checked={isTickerActive}
                onChange={(e) => setIsTickerActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="tickerToggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Enable Announcement Ticker Live on Storefront
              </label>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Storefront Live Preview
              </span>
              <div className="p-3.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-bold text-center border border-slate-800 shadow-inner">
                {isTickerActive ? tickerText : "(Ticker is currently disabled)"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveTicker}
              disabled={isCreating || isUpdating}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isCreating || isUpdating ? "Saving..." : "Save Ticker Configurations"}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE STOREFRONT SIMULATOR                                          */}
        {/* ========================================================================= */}
        {activeTab === "simulator" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Hero Slider & Storefront Simulator</h3>
                <p className="text-xs text-slate-500">Live simulation of how your hero carousel and promo layout render on the storefront</p>
              </div>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Open Full Storefront ↗
              </a>
            </div>

            {/* Announcement Ticker Bar Simulator */}
            {isTickerActive && (
              <div className="bg-slate-950 text-amber-300 px-4 py-2 text-center text-xs font-semibold tracking-wide rounded-t-xl">
                {tickerText}
              </div>
            )}

            {/* Hero Carousel Simulator */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-900 min-h-[340px] relative flex items-center justify-center p-8 text-white">
              {heroBanners.length > 0 ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center brightness-60"
                    style={{ backgroundImage: `url('${heroBanners[0].image?.url}')` }}
                  />
                  <div className="relative z-10 text-center space-y-2 max-w-lg">
                    <h3 className="text-2xl sm:text-3xl font-extrabold">{heroBanners[0].title}</h3>
                    <p className="text-xs text-slate-200">{heroBanners[0].subtitle}</p>
                    <div className="pt-2">
                      <span className="px-6 py-2 bg-white text-slate-900 text-xs font-bold rounded-full inline-block shadow-sm">
                        {heroBanners[0].buttonText || "Shop Now"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">No active hero slide to simulate</div>
              )}
            </div>

            {/* Promo Strip Mini Preview */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">4-Banner Promo Strip Simulation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {promotionalBanners.filter((b) => b.position === "promo_strip").slice(0, 4).map((b) => (
                  <div key={b._id} className="relative h-24 rounded-xl overflow-hidden shadow-xs bg-slate-800 group">
                    <img src={b.image?.url} alt={b.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 flex flex-col justify-end text-white">
                      <span className="text-[11px] font-bold truncate">{b.title}</span>
                      <span className="text-[9px] text-slate-300 truncate">{b.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Banner Modal (Supports All Positions, Badges & Prices) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {editingBanner ? "Edit Banner Slot" : "Create New Banner Slot"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure storefront position, visuals, badge labels, and link routes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                {/* Position / Slot Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Storefront Slot / Position <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bannerForm.position}
                    onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-800"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Banner Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="e.g. Discover the Latest Deals – Up to 50% Off!"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="e.g. Daily comfort, modern cut & premium deals"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Badge Tag & Price Tag (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Badge Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.badge}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      placeholder="e.g. 15% OFF, ৳200, COMING SOON"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Price Tag / Secondary (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.priceTag}
                      onChange={(e) => setBannerForm({ ...bannerForm, priceTag: e.target.value })}
                      placeholder="e.g. ৳750, ৳49"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Button Text & Priority (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Button CTA Label
                    </label>
                    <input
                      type="text"
                      value={bannerForm.buttonText}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                      placeholder="e.g. Shop Now, Visit store, Buy now"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Priority Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bannerForm.priority}
                      onChange={(e) => setBannerForm({ ...bannerForm, priority: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Banner Image Upload */}
                <BannerImageUpload
                  value={bannerForm.imageUrl}
                  onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
                  label="Banner Image"
                />

                {/* Target URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Target Route / Link URL
                  </label>
                  <input
                    type="text"
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                    placeholder="/products?category=electronics"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium font-mono"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="bannerActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Active & Live on Storefront
                  </label>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="w-full sm:w-auto px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                >
                  {isCreating || isUpdating ? "Saving..." : editingBanner ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBannersPage;
