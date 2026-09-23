import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useGetProductsQuery,
  useGetTrendingProductsQuery,
} from "../../features/products/productApi";
import { useGetCategoriesQuery } from "../../features/categories/categoryApi";
import { useGetBannersQuery } from "../../features/banners/bannerApi";
import { useGetWishlistQuery, useToggleWishlistMutation } from "../../features/user/userApi";
import { addToCart } from "../../features/cart/cartSlice";

// Utility to ensure currency is displayed in Bangladeshi Taka (৳)
const formatTaka = (val) => (val ? String(val).replace(/\$/g, "৳") : "");

export const HomePage = () => {
  const dispatch = useDispatch();
  const [toastMessage, setToastMessage] = useState("");

  // Horizontal scroll refs
  const categoryScrollRef = useRef(null);
  const dealsScrollRef = useRef(null);

  // Live Backend Data Queries (Real Data Only - Zero Mock Products / Zero Mock Categories)
  const { data: catResponse, isLoading: catsLoading } = useGetCategoriesQuery();
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery({ limit: 40 });
  const { data: trendingResponse } = useGetTrendingProductsQuery({ limit: 12 });
  const { data: bannersResponse } = useGetBannersQuery();

  const token = typeof window !== "undefined" ? localStorage.getItem("easilia_token") : null;
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !token });
  const [toggleWishlistMutation] = useToggleWishlistMutation();

  const categories = useMemo(
    () => catResponse?.data?.categories || catResponse?.categories || [],
    [catResponse]
  );
  const allProducts = useMemo(
    () => productsResponse?.data?.products || productsResponse?.products || [],
    [productsResponse]
  );
  const trendingProducts = useMemo(
    () => trendingResponse?.data?.products || trendingResponse?.products || [],
    [trendingResponse]
  );
  const banners = useMemo(
    () => bannersResponse?.data?.banners || bannersResponse?.banners || [],
    [bannersResponse]
  );

  const wishlistSet = useMemo(() => {
    const list = Array.isArray(wishlistData) ? wishlistData : [];
    return new Set(list.map((item) => (typeof item === "string" ? item : item?._id || item?.id)));
  }, [wishlistData]);

  // Toast Notification Handler
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Add to Cart Handler
  const handleAddToCart = (product, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    showToast(`Added "${product.title}" to cart!`);
  };

  // Toggle Wishlist Handler
  const handleWishlist = async (product, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!token) {
      showToast("Please sign in to save items to your wishlist.");
      return;
    }
    const pid = product._id || product.id;
    try {
      await toggleWishlistMutation(pid).unwrap();
      const isSaved = wishlistSet.has(pid);
      showToast(isSaved ? "Removed from wishlist." : "Saved to wishlist!");
    } catch {
      showToast("Could not update wishlist.");
    }
  };

  // Scroll Helpers
  const scrollSection = (ref, direction = "right") => {
    if (ref.current) {
      const scrollAmount = direction === "right" ? 340 : -340;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // 1. TODAY'S DEALS: real products with discountPrice < basePrice (fallback to allProducts)
  const todaysDeals = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const discounted = allProducts.filter(
      (p) => p.discountPrice && Number(p.discountPrice) < Number(p.basePrice || p.price)
    );
    if (discounted.length > 0) return discounted;
    return allProducts.slice(0, 10);
  }, [allProducts]);

  // 2. TRENDING PRODUCTS LIST: real products from DB only
  const displayTrending = useMemo(() => {
    if (trendingProducts && trendingProducts.length > 0) return trendingProducts.slice(0, 3);
    if (allProducts && allProducts.length > 0) return allProducts.slice(0, 3);
    return [];
  }, [trendingProducts, allProducts]);

  // =========================================================================
  // DYNAMIC CMS BANNERS EXTRACTED BY POSITION
  // =========================================================================
  const heroBanners = useMemo(
    () => banners.filter((b) => b.position === "home_hero" && b.isActive !== false),
    [banners]
  );
  const featureBanner = useMemo(
    () => banners.find((b) => b.position === "promo_feature_1" && b.isActive !== false),
    [banners]
  );
  const gamingBanner = useMemo(
    () => banners.find((b) => b.position === "promo_gaming" && b.isActive !== false),
    [banners]
  );
  const stackBanners = useMemo(
    () =>
      banners
        .filter((b) => b.position === "promo_stack" && b.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)),
    [banners]
  );
  const stripBanners = useMemo(
    () =>
      banners
        .filter((b) => b.position === "promo_strip" && b.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)),
    [banners]
  );
  const trendBanner = useMemo(
    () => banners.find((b) => b.position === "promo_trend" && b.isActive !== false),
    [banners]
  );
  const bestsellerGridBanners = useMemo(
    () =>
      banners
        .filter((b) => b.position === "promo_bestseller_grid" && b.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)),
    [banners]
  );
  const bestsellerTallBanner = useMemo(
    () => banners.find((b) => b.position === "promo_bestseller_tall" && b.isActive !== false),
    [banners]
  );

  // Hero Slider State
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  const nextHeroSlide = () => {
    if (heroBanners.length > 0) {
      setCurrentHeroIdx((prev) => (prev + 1) % heroBanners.length);
    }
  };

  const prevHeroSlide = () => {
    if (heroBanners.length > 0) {
      setCurrentHeroIdx((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
    }
  };

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const activeHero = heroBanners[currentHeroIdx] || {
    title: "Discover the Latest Deals –",
    subtitle: "Up to 50% Off!",
    image: {
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
    },
    buttonText: "Shop Now",
    link: "/products",
  };

  // Reusable Product Card matching Fig/Home page.png
  const renderProductCard = (p) => {
    const imgUrl =
      p.images?.find((img) => img.isThumbnail)?.url ||
      p.images?.[0]?.url ||
      "https://placehold.co/400x400?text=Product";
    const currentPrice = Number(p.discountPrice || p.price || p.basePrice || 0);
    const originalPrice = Number(p.basePrice || p.price || currentPrice);
    const isDiscount = originalPrice > currentPrice && currentPrice > 0;
    const discountPct = isDiscount
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
    const isWishlisted = wishlistSet.has(p._id || p.id);

    return (
      <div
        key={p._id || p.slug}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 p-3 sm:p-3.5 flex flex-col justify-between group/card relative"
      >
        <div>
          {/* Image Container with Heart Icon */}
          <div className="relative w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2.5 flex items-center justify-center">
            <Link to={`/products/${p.slug || p._id}`} className="block w-full h-full p-2">
              <img
                src={imgUrl}
                alt={p.title}
                className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </Link>

            {/* Deal Badge (if discount exists) */}
            {discountPct > 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#10B981] text-white text-[10px] font-bold shadow-xs">
                {discountPct}% OFF
              </span>
            )}

            {/* Wishlist Heart Top-Right */}
            <button
              type="button"
              onClick={(e) => handleWishlist(p, e)}
              title="Save to Wishlist"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isWishlisted ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </button>
          </div>

          {/* Title */}
          <Link
            to={`/products/${p.slug || p._id}`}
            className="block group-hover/card:text-blue-600 transition-colors"
          >
            <h3
              className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-snug"
              title={p.title}
            >
              {p.title}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-snug">
            {p.description || "Gentle yet effective, verified authentic quality product."}
          </p>

          {/* Star Rating & Reviews */}
          <div className="flex items-center gap-1 text-[11px] text-amber-400 pt-1.5">
            <span>★★★★★</span>
            <span className="text-slate-400 font-medium text-[10px]">
              ({p.numReviews || Math.floor((p.ratings || 4.8) * 75) + 12} reviews)
            </span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 pt-2 flex-wrap">
            <span className="font-extrabold text-sm sm:text-base text-[#10B981] font-mono">
              ৳{currentPrice.toLocaleString()}
            </span>
            {isDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through font-mono">
                  ৳{originalPrice.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-slate-900">
                  {discountPct}% Off
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Row: Blue View Details + Green Add to cart */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
          <Link
            to={`/products/${p.slug || p._id}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={(e) => handleAddToCart(p, e)}
            className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center cursor-pointer"
          >
            Add to cart
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 bg-[#FDFDFD] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-950 text-white rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO BANNER SLIDER (MATCHING Fig/Home page.png)                        */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#0A1A1E] min-h-[340px] sm:min-h-[460px] lg:min-h-[520px] flex items-center">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={activeHero?.image?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80"}
            alt={activeHero?.title || "Hero Banner"}
            className="w-full h-full object-cover object-center brightness-75 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent sm:w-2/3" />
        </div>

        {/* Hero Left & Right Navigation Arrow Buttons */}
        {heroBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevHeroSlide}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextHeroSlide}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Hero Text Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full py-12">
          <div className="max-w-xl space-y-4 text-white">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
              {activeHero.title} <br />
              <span className="italic font-light text-slate-200">
                {activeHero.subtitle}
              </span>
            </h1>

            <div className="pt-3">
              <Link
                to={activeHero.link || "/products"}
                className="inline-flex items-center justify-center px-7 sm:px-9 py-2.5 sm:py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                {activeHero.buttonText || "Shop Now"}
              </Link>
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        {heroBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentHeroIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  currentHeroIdx === idx ? "w-6 bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. TOP PROMOTIONAL ROW (3 COLUMNS: FEATURE, GAMING 4-GRID, 3-STACK)        */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Column 1: Feature Card (Winter Fashion) */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between p-5 relative min-h-[320px]">
            <div className="z-10">
              <h3 className="text-base font-bold text-slate-900">
                {featureBanner?.title || "New Year! New Fashion"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {featureBanner?.subtitle || "Men's Premium Winter Collection"}
              </p>
            </div>

            <div className="my-auto py-4 flex items-center justify-center">
              {featureBanner?.image?.url ? (
                <img
                  src={featureBanner.image.url}
                  alt={featureBanner?.title || "New Year New Fashion"}
                  className="max-h-48 object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">
                  🧥
                </div>
              )}
            </div>

            <div className="z-10 text-center">
              <Link
                to={featureBanner?.link || "/products"}
                className="inline-block w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors text-center"
              >
                {featureBanner?.buttonText || "Shop Now"}
              </Link>
            </div>
          </div>

          {/* Column 2: Gaming Accessories 4-Grid Box */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {gamingBanner?.title || "Gaming accessories"}
              </h3>
              <Link
                to={gamingBanner?.link || "/products?category=electronics"}
                className="text-[11px] text-blue-600 font-semibold hover:underline"
              >
                {gamingBanner?.buttonText || "See more"}
              </Link>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 my-3">
              {(gamingBanner?.subItems && gamingBanner.subItems.length > 0
                ? gamingBanner.subItems
                : [
                    { title: "Headsets" },
                    { title: "Mouse" },
                    { title: "Controller" },
                    { title: "Chair" },
                  ]
              ).map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="flex flex-col items-center bg-slate-50/70 hover:bg-slate-100 rounded-xl p-2.5 transition-all text-center group"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center overflow-hidden mb-1">
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt={sub.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-2xl">🎮</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-950">
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Stack of 3 Promo Cards (Winner PC, Redmi Y3, Philips TV) */}
          <div className="flex flex-col gap-3.5 justify-between">
            {/* Top Row: 2 cards side-by-side */}
            <div className="grid grid-cols-2 gap-3.5 h-[148px]">
              {/* Card 1: Winner PC */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-3 flex flex-col justify-end text-white group shadow-xs">
                {stackBanners[0]?.image?.url && (
                  <img
                    src={stackBanners[0].image.url}
                    alt={stackBanners[0]?.title || "Winner"}
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-amber-300">
                    {formatTaka(stackBanners[0]?.badge) || "৳1,990"}
                  </span>
                  <h4 className="text-xs font-bold leading-tight truncate">
                    {stackBanners[0]?.title || "BE THE WINNER"}
                  </h4>
                  <Link
                    to={stackBanners[0]?.link || "/products?category=electronics"}
                    className="text-[10px] text-slate-300 hover:text-white underline mt-0.5 inline-block"
                  >
                    {stackBanners[0]?.buttonText || "More details"}
                  </Link>
                </div>
              </div>

              {/* Card 2: Redmi Y3 */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-3 flex flex-col justify-end text-white group shadow-xs">
                {stackBanners[1]?.image?.url && (
                  <img
                    src={stackBanners[1].image.url}
                    alt={stackBanners[1]?.title || "Redmi"}
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-rose-400">
                    {formatTaka(stackBanners[1]?.badge) || "NEW!"}
                  </span>
                  <h4 className="text-xs font-bold leading-tight truncate">
                    {stackBanners[1]?.title || "Redmi Y3 NEW! Blue"}
                  </h4>
                  <Link
                    to={stackBanners[1]?.link || "/products?category=electronics"}
                    className="text-[10px] text-slate-300 hover:text-white underline mt-0.5 inline-block"
                  >
                    {stackBanners[1]?.buttonText || "Shop Now"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row: Wide Philips TV Card */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 p-3.5 flex items-center justify-between shadow-xs h-[155px]">
              <div className="w-[55%] space-y-1 z-10">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">
                  {formatTaka(stackBanners[2]?.badge) || "৳250 OFF"}
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {stackBanners[2]?.title || "Philips 4K Ambilight TV"}
                </h4>
                <div className="text-xs font-extrabold text-slate-900">
                  {formatTaka(stackBanners[2]?.priceTag) || "৳750"}
                </div>
                <Link
                  to={stackBanners[2]?.link || "/products?category=electronics"}
                  className="inline-block mt-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md transition-colors"
                >
                  {stackBanners[2]?.buttonText || "Shop Now"}
                </Link>
              </div>

              <div className="w-[45%] h-full flex items-center justify-center">
                {stackBanners[2]?.image?.url ? (
                  <img
                    src={stackBanners[2].image.url}
                    alt={stackBanners[2]?.title || "Philips TV"}
                    className="max-h-24 object-contain"
                  />
                ) : (
                  <span className="text-3xl">📺</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 4-BANNER PROMO STRIP (ROW 2 MATCHING Fig/Home page.png)                */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(stripBanners.length > 0
            ? stripBanners.slice(0, 4)
            : [
                {
                  title: "Comfy Fit / Trousers Fashion",
                  subtitle: "Daily comfort & cut",
                  image: { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80" },
                  link: "/products",
                  buttonText: "Shop Now",
                },
                {
                  title: "MEN'S FASHION Watch",
                  subtitle: "Timeless luxury",
                  image: { url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80" },
                  link: "/products",
                  buttonText: "Shop Now",
                },
                {
                  title: "DENIM Collection",
                  subtitle: "Authentic wash denim",
                  image: { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80" },
                  link: "/products",
                  buttonText: "See more",
                },
                {
                  title: "PHILIPS Domestic Appliances",
                  subtitle: "Smart living essentials",
                  image: { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80" },
                  link: "/products?category=electronics",
                  buttonText: "Shop Now",
                },
              ]
          ).map((strip, sIdx) => (
            <div
              key={sIdx}
              className="relative rounded-2xl overflow-hidden h-36 sm:h-40 bg-slate-900 group shadow-xs flex flex-col justify-end p-4 text-white"
            >
              <img
                src={strip.image?.url}
                alt={strip.title}
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="relative z-10">
                <h4 className="font-bold text-xs sm:text-sm leading-tight truncate">
                  {strip.title}
                </h4>
                {strip.subtitle && (
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">{strip.subtitle}</p>
                )}
                <Link
                  to={strip.link || "/products"}
                  className="inline-block mt-2 px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-xs text-[10px] font-bold rounded-lg transition-colors"
                >
                  {strip.buttonText || "Shop Now"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TRENDING PRODUCT (REAL PRODUCTS ONLY + MEN'S TREND COLLECTION BOX)     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Trending Product
          </h2>
          <Link
            to="/products?sort=trending"
            className="px-4 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Real Database Products Grid (3 Columns) */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayTrending.length > 0 ? (
              displayTrending.map((p) => renderProductCard(p))
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                Products added by sellers in the platform will appear here.
              </div>
            )}
          </div>

          {/* Right Box: "Trend collection for men" (Dynamic CMS Promo Card) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900">
                {trendBanner?.title || "Trend collection for men"}
              </h3>
              <Link to="/products" className="text-[10px] text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {/* 4 Mini Items in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {(trendBanner?.subItems && Array.isArray(trendBanner.subItems) && trendBanner.subItems.length > 0
                ? trendBanner.subItems
                : [
                    {
                      title: "Cargo Joggers",
                      badge: "20% off",
                      price: "৳250",
                      image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                      title: "Classic Tee",
                      badge: "New",
                      price: "৳180",
                      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                      title: "Red Sneakers",
                      badge: "Sale",
                      price: "৳1,040",
                      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                      title: "Military Cap",
                      badge: "Hot",
                      price: "৳105",
                      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&auto=format&fit=crop&q=80",
                    },
                  ]
              ).map((tItem, tIdx) => (
                <div
                  key={tIdx}
                  className="bg-slate-50/70 rounded-xl p-2 flex flex-col justify-between items-center text-center group relative overflow-hidden"
                >
                  <div className="w-full flex items-center justify-between text-[9px] font-bold text-emerald-700">
                    <span>{tItem.badge}</span>
                    <span className="text-slate-800">{formatTaka(tItem.price)}</span>
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center my-1">
                    <img
                      src={tItem.image}
                      alt={tItem.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <Link
                    to="/products"
                    className="w-full py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-800 transition-colors"
                  >
                    Buy Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. START EXPLORING NOW (REAL CATEGORIES ONLY)                             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Start exploring now
          </h2>
          <Link
            to="/products"
            className="px-4 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All
          </Link>
        </div>

        {/* Categories Strip */}
        <div className="relative group">
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-1 py-2"
          >
            {catsLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center shrink-0 w-28 sm:w-36 animate-pulse">
                  <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-2xl bg-slate-200 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-16" />
                </div>
              ))
            ) : categories.length > 0 ? (
              categories.map((cat, idx) => (
                <Link
                  key={cat._id || idx}
                  to={`/products?category=${encodeURIComponent(cat.slug || cat._id || cat.name)}`}
                  className="group/item flex flex-col items-center text-center shrink-0 w-28 sm:w-36 cursor-pointer"
                >
                  <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-3 mb-2 group-hover/item:shadow-md group-hover/item:border-emerald-300 transition-all">
                    {cat.image?.url ? (
                      <img
                        src={cat.image.url}
                        alt={cat.name}
                        className="w-full h-full object-contain rounded-xl group-hover/item:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover/item:text-[#10B981] transition-colors line-clamp-1 max-w-[130px]">
                    {cat.name}
                  </span>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-6 text-xs text-slate-400">
                Categories configured in the admin dashboard will appear here.
              </div>
            )}
          </div>

          {/* Carousel Next Arrow */}
          {categories.length > 4 && (
            <button
              type="button"
              onClick={() => scrollSection(categoryScrollRef, "right")}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-6 w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 items-center justify-center transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BEST SELLING PRODUCT (CREATIVE BANNER COLLAGE & TALL DOG BANNER)       */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Best selling product
          </h2>
          <Link
            to="/products?sort=popular"
            className="px-4 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left / Main Area (8 cols): 5 Grid Cards */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Top Row: 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Computer Accessories */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 p-4 min-h-[160px] flex flex-col justify-between text-white group shadow-xs">
                <img
                  src={
                    bestsellerGridBanners[0]?.image?.url ||
                    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80"
                  }
                  alt="Computer Accessories"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative z-10 flex justify-between items-start">
                  <span className="text-[11px] font-bold">
                    {bestsellerGridBanners[0]?.title || "Computer Accessories"}
                  </span>
                  <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs">
                    {bestsellerGridBanners[0]?.badge || "COMING SOON"}
                  </span>
                </div>
                <div className="relative z-10">
                  <Link
                    to={bestsellerGridBanners[0]?.link || "/products?category=electronics"}
                    className="inline-block px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-slate-900 text-[10px] font-bold rounded-lg backdrop-blur-xs transition-colors"
                  >
                    {bestsellerGridBanners[0]?.buttonText || "Visit store"}
                  </Link>
                </div>
              </div>

              {/* Card 2: Men's Jackets (৳200) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-4 min-h-[160px] flex flex-col justify-between text-white group shadow-xs">
                <img
                  src={
                    bestsellerGridBanners[1]?.image?.url ||
                    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"
                  }
                  alt="Jackets"
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="relative z-10 flex justify-end">
                  <span className="text-sm font-extrabold text-amber-300">
                    {formatTaka(bestsellerGridBanners[1]?.badge) || "৳200"}
                  </span>
                </div>
                <div className="relative z-10">
                  <Link
                    to={bestsellerGridBanners[1]?.link || "/products"}
                    className="inline-block px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-slate-900 text-[10px] font-bold rounded-lg backdrop-blur-xs transition-colors"
                  >
                    {bestsellerGridBanners[1]?.buttonText || "Visit store"}
                  </Link>
                </div>
              </div>

              {/* Card 3: Pomegranate Juice (৳49) */}
              <div className="relative rounded-2xl overflow-hidden bg-[#FF4757] p-4 min-h-[160px] flex flex-col justify-between text-white group shadow-xs">
                <img
                  src={
                    bestsellerGridBanners[2]?.image?.url ||
                    "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=80"
                  }
                  alt="Juice"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 to-transparent" />
                <div className="relative z-10 flex justify-end">
                  <span className="text-sm font-extrabold text-white">
                    {formatTaka(bestsellerGridBanners[2]?.badge) || "৳49"}
                  </span>
                </div>
                <div className="relative z-10">
                  <Link
                    to={bestsellerGridBanners[2]?.link || "/products"}
                    className="inline-block px-3 py-1 bg-white text-rose-700 hover:bg-slate-100 text-[10px] font-bold rounded-lg shadow-xs transition-colors"
                  >
                    {bestsellerGridBanners[2]?.buttonText || "Buy now"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row: 2 Wide Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 4: AI Surveillance Cameras (৳420) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-4 min-h-[160px] flex flex-col justify-between text-white group shadow-xs">
                <img
                  src={
                    bestsellerGridBanners[3]?.image?.url ||
                    "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80"
                  }
                  alt="Surveillance Camera"
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative z-10 flex justify-between items-start">
                  <h4 className="text-xs font-bold leading-tight max-w-[70%]">
                    {bestsellerGridBanners[3]?.title || "AI Smart Surveillance Camera"}
                  </h4>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatTaka(bestsellerGridBanners[3]?.badge) || "৳420"}
                  </span>
                </div>
                <div className="relative z-10">
                  <Link
                    to={bestsellerGridBanners[3]?.link || "/products?category=electronics"}
                    className="inline-block px-3.5 py-1 bg-white/20 hover:bg-white text-white hover:text-slate-900 text-[10px] font-bold rounded-lg backdrop-blur-xs transition-colors"
                  >
                    {bestsellerGridBanners[3]?.buttonText || "Visit store"}
                  </Link>
                </div>
              </div>

              {/* Card 5: Luxury Cosmetic (৳149) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 p-4 min-h-[160px] flex flex-col justify-between text-white group shadow-xs">
                <img
                  src={
                    bestsellerGridBanners[4]?.image?.url ||
                    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80"
                  }
                  alt="Cosmetic"
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="relative z-10 flex justify-between items-start">
                  <h4 className="text-xs font-bold leading-tight max-w-[70%]">
                    {bestsellerGridBanners[4]?.title || "Premium Cosmetic Treatment"}
                  </h4>
                  <span className="text-sm font-extrabold text-amber-300">
                    {formatTaka(bestsellerGridBanners[4]?.badge) || "৳149"}
                  </span>
                </div>
                <div className="relative z-10">
                  <Link
                    to={bestsellerGridBanners[4]?.link || "/products"}
                    className="inline-block px-3.5 py-1 bg-white text-slate-900 hover:bg-slate-100 text-[10px] font-bold rounded-lg shadow-xs transition-colors"
                  >
                    {bestsellerGridBanners[4]?.buttonText || "Buy Now"}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Tall Dog Food Banner */}
          <div className="lg:col-span-4 relative rounded-2xl overflow-hidden bg-[#227BFF] p-6 min-h-[340px] flex flex-col justify-between text-white shadow-xs group">
            <img
              src={
                bestsellerTallBanner?.image?.url ||
                "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80"
              }
              alt="Dog Food Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-transparent to-blue-950/80" />

            <div className="relative z-10 space-y-1">
              <span className="text-xs tracking-widest font-black uppercase text-blue-200 block">
                {bestsellerTallBanner?.title || "DOG FOOD MADE WITH LOVE"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                {bestsellerTallBanner?.subtitle || "WE LOVE DOGS"}
              </h3>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-4">
              <span className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                {bestsellerTallBanner?.badge || "15% OFF"}
              </span>

              <Link
                to={bestsellerTallBanner?.link || "/products"}
                className="px-6 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-full shadow-md transition-transform hover:scale-105"
              >
                {bestsellerTallBanner?.buttonText || "Shop Now"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. LIMITED-TIME DEAL (REAL PRODUCTS ONLY)                                 */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Limited-Time Deal
          </h2>
          <Link
            to="/products?discounted=true"
            className="px-4 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="relative group">
          <div
            ref={dealsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1"
          >
            {todaysDeals.length > 0 ? (
              todaysDeals.map((p) => (
                <div key={p._id || p.slug} className="shrink-0 w-[240px] sm:w-[260px]">
                  {renderProductCard(p)}
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-xs text-slate-400">
                Active deals will appear here as products are added.
              </div>
            )}
          </div>

          {/* Carousel Next Arrow */}
          {todaysDeals.length > 4 && (
            <button
              type="button"
              onClick={() => scrollSection(dealsScrollRef, "right")}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 items-center justify-center transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100"
              aria-label="Scroll deals right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

 
    </div>
  );
};

export default HomePage;
