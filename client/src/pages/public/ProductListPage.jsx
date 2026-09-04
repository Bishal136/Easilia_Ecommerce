import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  SlidersHorizontal,
  Globe,
  Percent,
  Check,
  Star,
  LayoutGrid,
  List,
  Heart,
  Eye,
  ShoppingCart,
  Play,
  Search,
  ChevronDown,
  Loader2,
  X,
  Package,
} from "lucide-react";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetCategoriesQuery } from "../../features/categories/categoryApi";
import { useGetWishlistQuery, useToggleWishlistMutation } from "../../features/user/userApi";
import { addToCart } from "../../features/cart/cartSlice";

export const ProductListPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state sync
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "popular";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [selectedPricePreset, setSelectedPricePreset] = useState(null);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [previewProduct, setPreviewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Backend Live Queries
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    isFetching,
    refetch,
  } = useGetProductsQuery({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    inStock: inStockOnly ? "true" : undefined,
    discounted: discountedOnly ? "true" : undefined,
    minPrice: appliedMinPrice || undefined,
    maxPrice: appliedMaxPrice || undefined,
    rating: selectedRating > 0 ? selectedRating : undefined,
    search: searchQuery || undefined,
    sort: sortBy,
    limit: 60,
  });

  const { data: categoriesResponse } = useGetCategoriesQuery();
  const { data: wishlistItems = [] } = useGetWishlistQuery(undefined, {
    skip: !localStorage.getItem("easilia_token"),
  });
  const [toggleWishlistMutation] = useToggleWishlistMutation();

  // Extract products and categories from backend responses
  const products = useMemo(() => {
    return productsResponse?.data?.products || productsResponse?.products || [];
  }, [productsResponse]);

  const categories = useMemo(() => {
    return categoriesResponse?.data?.categories || categoriesResponse?.categories || [];
  }, [categoriesResponse]);

  const wishlistProductIds = useMemo(() => {
    return new Set(wishlistItems.map((it) => it._id || it.id || it));
  }, [wishlistItems]);

  // Toast Notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Add To Cart Handler
  const handleAddToCart = (product, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    dispatch(
      addToCart({
        product,
        quantity: 1,
      })
    );
    showToast(`Added "${product.title}" to cart!`);
  };

  // Wishlist Toggle Handler
  const handleToggleWishlist = async (productId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await toggleWishlistMutation(productId).unwrap();
      showToast("Wishlist updated!");
    } catch {
      showToast("Please sign in to save items to your wishlist.");
    }
  };

  // Category Selection Handler
  const handleCategoryClick = (catSlugOrId) => {
    setSelectedCategory(catSlugOrId);
    if (catSlugOrId === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", catSlugOrId);
    }
    setSearchParams(searchParams);
  };

  // Price Preset Selection
  const handlePricePreset = (min, max, label) => {
    if (selectedPricePreset === label) {
      setSelectedPricePreset(null);
      setMinPriceInput("");
      setMaxPriceInput("");
      setAppliedMinPrice("");
      setAppliedMaxPrice("");
    } else {
      setSelectedPricePreset(label);
      setMinPriceInput(min !== null ? min.toString() : "");
      setMaxPriceInput(max !== null ? max.toString() : "");
      setAppliedMinPrice(min !== null ? min.toString() : "");
      setAppliedMaxPrice(max !== null ? max.toString() : "");
    }
  };

  // Apply Custom Price Filter
  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    setSelectedPricePreset(null);
    setAppliedMinPrice(minPriceInput);
    setAppliedMaxPrice(maxPriceInput);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSelectedCategory("all");
    setInStockOnly(false);
    setDiscountedOnly(false);
    setSelectedPricePreset(null);
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setSelectedRating(0);
    setSearchQuery("");
    setSortBy("popular");
    setSearchParams({});
  };

  const getSortLabel = (val) => {
    switch (val) {
      case "popular":
      case "popularity":
        return "popularity";
      case "newest":
        return "newest arrivals";
      case "price-low":
      case "price_asc":
        return "price: low to high";
      case "price-high":
      case "price_desc":
        return "price: high to low";
      case "rating":
      case "top-rated":
        return "customer rating";
      default:
        return "popularity";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top Header & Subtitle                                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover verified items, rich media, and multi-variant products delivered quickly to your doorstep.
          </p>
        </div>

        {/* View Mode Switcher (Grid / List) */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-Column Catalog Layout: Left Sidebar + Right Grid                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================================= */}
        {/* LEFT SIDEBAR: Filters                                                   */}
        {/* ======================================================================= */}
        <aside className="lg:col-span-3 bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-7">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Filter Products</span>
            </div>
            {(selectedCategory !== "all" ||
              inStockOnly ||
              discountedOnly ||
              appliedMinPrice ||
              appliedMaxPrice ||
              selectedRating > 0) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-[#166534] hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Checkbox Toggles */}
          <div className="space-y-3">
            {/* In-Stock Items Only */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>In-Stock Items Only</span>
              </div>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#166534] focus:ring-[#166534] accent-[#166534] cursor-pointer"
              />
            </label>

            {/* Discounted / On Sale */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Percent className="w-4 h-4 text-rose-500" />
                <span>Discounted / On Sale</span>
              </div>
              <input
                type="checkbox"
                checked={discountedOnly}
                onChange={(e) => setDiscountedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#166534] focus:ring-[#166534] accent-[#166534] cursor-pointer"
              />
            </label>
          </div>

          {/* CATEGORIES Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              CATEGORIES
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => handleCategoryClick("all")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <span>All Categories</span>
                {selectedCategory === "all" && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </button>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const catValue = cat.slug || cat._id || cat.name;
                const isSelected = selectedCategory === catValue || selectedCategory === cat.slug;

                return (
                  <button
                    key={cat._id || cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(catValue)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRICE RANGE (৳) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PRICE RANGE (৳)
            </h3>

            {/* Quick 2x2 Preset Pills */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Under ৳500", min: 0, max: 500 },
                { label: "৳500 - ৳1,000", min: 500, max: 1000 },
                { label: "৳1,000 - ৳2,500", min: 1000, max: 2500 },
                { label: "Above ৳2,500", min: 2500, max: null },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePricePreset(preset.min, preset.max, preset.label)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                    selectedPricePreset === preset.label
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                      : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Min / Max Inputs */}
            <form onSubmit={handleApplyPriceFilter} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Min Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#166534]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Max Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      placeholder="Any"
                      className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#166534]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              >
                Apply Price Filter
              </button>
            </form>
          </div>

          {/* CUSTOMER RATING */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              CUSTOMER RATING
            </h3>
            <div className="space-y-1.5">
              {[5, 4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedRating === stars
                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">& Up</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* RIGHT CONTENT: Results Bar & Product Cards                              */}
        {/* ======================================================================= */}
        <main className="lg:col-span-9 space-y-6">
          {/* Results Count & Sorting Bar */}
          <div className="bg-white dark:bg-slate-950 rounded-3xl px-6 py-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>
                Showing <strong className="text-slate-900 dark:text-white font-bold">{products.length}</strong> products
              </span>
              <span className="text-emerald-700 font-semibold">(Sorted by: {getSortLabel(sortBy)})</span>
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 ml-1" />}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  searchParams.set("sort", e.target.value);
                  setSearchParams(searchParams);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="popular">Popularity</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingProducts ? (
            <div className="bg-white dark:bg-slate-950 rounded-3xl p-20 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#166534] mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Fetching catalog items from backend...
              </p>
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-950 rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center text-2xl">
                <Package className="w-8 h-8 stroke-1" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Products Found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We couldn't find any items matching your selected criteria. Try clearing filters or expanding your price range.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* =================================================================== */
            /* GRID VIEW (3 Columns matching design)                               */
            /* =================================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => {
                const currentPrice = Number(product.discountPrice || product.price || product.basePrice || 0);
                const originalPrice = Number(product.basePrice || product.price || currentPrice);
                const hasDiscount = originalPrice > currentPrice && product.discountPrice > 0;
                const discountPct = hasDiscount
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0;
                const imgUrl =
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  "https://placehold.co/500x500?text=Product";
                const isWishlisted = wishlistProductIds.has(product._id || product.id);
                const categoryTitle =
                  product.category?.name || product.category || "ELECTRONICS";
                const sellerName = product.shop?.name || "Bishal Biswas's Shop";
                const ratingVal = product.ratings || product.rating || 4.5;
                const numReviews = product.numReviews || product.reviewsCount || 8;
                const hasVideo = Boolean(product.video || product.videoUrl || product.hasVideo);

                return (
                  <div
                    key={product._id || product.id}
                    className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Image Box */}
                      <div className="relative w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden mb-3 border border-slate-100 dark:border-slate-800">
                        <Link to={`/products/${product.slug || product._id}`}>
                          <img
                            src={imgUrl}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Top-Left Badges (Discount + Video) */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                          {hasDiscount && (
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-xs">
                              {discountPct}% OFF
                            </span>
                          )}
                          {hasVideo && (
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              Video
                            </span>
                          )}
                        </div>

                        {/* Top-Right Wishlist & Quick Preview Buttons */}
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleWishlist(product._id || product.id, e)}
                            className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-rose-500 hover:scale-110 flex items-center justify-center shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                            title="Save to Wishlist"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isWishlisted ? "fill-rose-500 text-rose-500" : ""
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(product)}
                            className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-indigo-600 hover:scale-110 flex items-center justify-center shadow-xs transition-all cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Category & Seller Row */}
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        <span className="text-[#166534] truncate max-w-[50%]">
                          {categoryTitle}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 truncate max-w-[50%] font-medium lowercase">
                          {sellerName}
                        </span>
                      </div>

                      {/* Product Title */}
                      <Link to={`/products/${product.slug || product._id}`}>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-[#166534] transition-colors leading-snug">
                          {product.title}
                        </h3>
                      </Link>

                      {/* Rating Row */}
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{ratingVal}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({numReviews})
                        </span>
                      </div>
                    </div>

                    {/* Price & Add to Cart Button */}
                    <div className="space-y-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          ৳{currentPrice.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            ৳{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =================================================================== */
            /* LIST VIEW (Horizontal Rows)                                         */
            /* =================================================================== */
            <div className="space-y-4">
              {products.map((product) => {
                const currentPrice = Number(product.discountPrice || product.price || product.basePrice || 0);
                const originalPrice = Number(product.basePrice || product.price || currentPrice);
                const hasDiscount = originalPrice > currentPrice && product.discountPrice > 0;
                const discountPct = hasDiscount
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0;
                const imgUrl =
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  "https://placehold.co/500x500?text=Product";
                const isWishlisted = wishlistProductIds.has(product._id || product.id);
                const categoryTitle =
                  product.category?.name || product.category || "ELECTRONICS";
                const sellerName = product.shop?.name || "Bishal Biswas's Shop";
                const ratingVal = product.ratings || product.rating || 4.5;
                const numReviews = product.numReviews || product.reviewsCount || 8;

                return (
                  <div
                    key={product._id || product.id}
                    className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 relative">
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        {hasDiscount && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-[#166534]">{categoryTitle}</span>
                          <span className="text-slate-400">• {sellerName}</span>
                        </div>
                        <Link to={`/products/${product.slug || product._id}`}>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-[#166534]">
                            {product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{ratingVal}</span>
                          <span className="text-slate-400 font-normal">({numReviews})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          ৳{currentPrice.toLocaleString()}
                        </p>
                        {hasDiscount && (
                          <p className="text-xs text-slate-400 line-through">
                            ৳{originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        className="px-5 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* Quick View Product Modal                                                  */}
      {/* ========================================================================= */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                Quick Product Overview
              </span>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={
                    previewProduct.images?.[0]?.url ||
                    previewProduct.images?.[0] ||
                    "https://placehold.co/500x500"
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {previewProduct.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {previewProduct.description || "High quality verified marketplace product with fast local shipping."}
                </p>

                <div className="text-xl font-black text-slate-900 dark:text-white">
                  ৳{(previewProduct.discountPrice || previewProduct.basePrice || previewProduct.price || 0).toLocaleString()}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAddToCart(previewProduct, e);
                      setPreviewProduct(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                  <Link
                    to={`/products/${previewProduct.slug || previewProduct._id}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Full Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
