import React, { useState, useEffect } from "react";
import {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from "../../features/banners/bannerApi";
import Spinner from "../../components/ui/Spinner";
import BannerImageUpload from "../../components/ui/BannerImageUpload";

export const AdminBannersPage = () => {
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "ticker" | "simulator"
  const [toast, setToast] = useState(null);

  // Announcement Ticker state
  const [tickerText, setTickerText] = useState("⚡ Special Deal: Free delivery on orders over ৳2,000! Use code DEALPORT");
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

  const rawBanners = bannersData?.data?.banners || bannersData?.banners || [];
  const heroBanners = rawBanners.filter((b) => b.position === "home_hero");
  const tickerBanner = rawBanners.find((b) => b.position === "ticker");
  const activeBannersCount = heroBanners.filter((b) => b.isActive).length;
  const [hasInitializedTicker, setHasInitializedTicker] = useState(false);

  useEffect(() => {
    if (tickerBanner && !hasInitializedTicker) {
      setTickerText(tickerBanner.title);
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
        link: "/products",
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

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setBannerForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      link: "/products",
      position: "home_hero",
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
      position: "home_hero",
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
        position: "home_hero",
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold animate-bounce transition-all ${
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

      {/* 1. Header Card Matching Figma */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center text-lg font-bold">
            🥞
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Homepage CMS & Banner Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control storefront hero sliders and live announcement tickers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              refetch();
              showToast("Banners refreshed!");
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
          >
            <span>+</span>
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Top Metric Cards Matching Figma */}
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
            <div className="text-2xl font-extrabold text-slate-900">{heroBanners.length}</div>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isTickerActive ? "Live Active" : "Disabled"}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
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

      {/* 3. Navigation Tabs Matching Figma */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("hero")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
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
            onClick={() => setActiveTab("ticker")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
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
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "simulator"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>📱</span>
            <span>Live Storefront Simulator</span>
          </button>
        </div>

        {/* 4. Tab 1: Hero Carousel Slides */}
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
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
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
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
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
                    <div className="relative h-36 bg-slate-900 overflow-hidden">
                      <img
                        src={slide.image?.url}
                        alt={slide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3.5 flex flex-col justify-end text-white">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded w-fit mb-1">
                          Priority: #{slide.priority ?? idx + 1}
                        </span>
                        <h4 className="font-bold text-xs truncate">{slide.title}</h4>
                        {slide.subtitle && (
                          <p className="text-[11px] text-slate-200 truncate mt-0.5">{slide.subtitle}</p>
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
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {slide.link}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(slide)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] text-slate-700 font-medium transition-colors"
                        >
                          {slide.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(slide)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[11px] font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(slide)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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

        {/* 5. Tab 2: Top Announcement Ticker */}
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
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="tickerToggle"
                checked={isTickerActive}
                onChange={(e) => setIsTickerActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300"
              />
              <label htmlFor="tickerToggle" className="text-xs font-semibold text-slate-800">
                Enable Announcement Ticker Live on Storefront
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-bold text-center border border-slate-800">
              Preview: {tickerText}
            </div>

            <button
              type="button"
              onClick={handleSaveTicker}
              disabled={isCreating || isUpdating}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {isCreating || isUpdating ? "Saving..." : "Save Ticker Configurations"}
            </button>
          </div>
        )}

        {/* 6. Tab 3: Live Storefront Simulator */}
        {activeTab === "simulator" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Hero Slider Simulator</h3>
                <p className="text-xs text-slate-500">Live simulation of how your hero carousel renders on the storefront</p>
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

            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-900 min-h-[300px] relative flex items-center justify-center p-8 text-white">
              {heroBanners.length > 0 ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center brightness-50"
                    style={{ backgroundImage: `url('${heroBanners[0].image?.url}')` }}
                  />
                  <div className="relative z-10 text-center space-y-2 max-w-lg">
                    <h3 className="text-2xl font-extrabold">{heroBanners[0].title}</h3>
                    <p className="text-xs text-slate-200">{heroBanners[0].subtitle}</p>
                    <button className="px-6 py-2 bg-white text-slate-900 text-xs font-bold rounded-full mt-2">
                      Shop Now
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">No active hero slide to simulate</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBanner ? "Edit Hero Banner Slide" : "Create New Hero Banner Slide"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure hero banner visuals and link routes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 text-xs text-slate-700">
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
                    placeholder="e.g. Shop trending fashion, high-end electronics & essentials"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Banner Image Upload */}
                <BannerImageUpload
                  value={bannerForm.imageUrl}
                  onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
                  label="Banner Image"
                />

                {/* Priority */}
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

                {/* Target URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Target Route / Link URL
                  </label>
                  <input
                    type="text"
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                    placeholder="/products?category=fashion"
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
                    className="w-4 h-4 text-purple-600 rounded border-slate-300"
                  />
                  <label htmlFor="bannerActive" className="text-xs font-semibold text-slate-800">
                    Active & Live on Storefront
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
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
