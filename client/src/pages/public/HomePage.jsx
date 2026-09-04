import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Star, ShoppingCart, Heart, Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetCategoriesQuery } from "../../features/categories/categoryApi";
import { useGetBannersQuery } from "../../features/banners/bannerApi";
import { addToCart } from "../../features/cart/cartSlice";

export const HomePage = () => {
  const dispatch = useDispatch();
  const [toastMessage, setToastMessage] = useState("");
  const [heroSlide, setHeroSlide] = useState(0);

  // Fetch Categories, Products & CMS Banners directly from Backend
  const { data: catResponse, isLoading: catsLoading } = useGetCategoriesQuery();
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery({ limit: 20 });
  const { data: bannersResponse } = useGetBannersQuery();

  const isLoading = catsLoading || productsLoading;

  const categories = catResponse?.data?.categories || catResponse?.categories || [];
  const products = productsResponse?.data?.products || productsResponse?.products || [];
  const banners = bannersResponse?.data?.banners || bannersResponse?.banners || [];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleAddToCart = (product, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    showToast(`Added "${product.title}" to cart!`);
  };

  const handleWishlist = (product, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    showToast(`"${product.title}" saved to wishlist!`);
  };

  // Skeleton shimmer placeholder for loading state
  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse">
      <div className="w-full aspect-square rounded-xl bg-slate-200 mb-3" />
      <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-2 bg-slate-200 rounded w-full mb-2" />
      <div className="h-2 bg-slate-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-full" />
    </div>
  );
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const liveHeroBanners = banners.filter(
    (b) => b.position === "home_hero" && b.isActive !== false
  );

  const middleBanners = useMemo(
    () => banners.filter((b) => b.position === "home_middle" && b.isActive !== false),
    [banners]
  );

  const bottomBanners = useMemo(
    () => banners.filter((b) => b.position === "home_bottom" && b.isActive !== false),
    [banners]
  );

  const defaultHeroSlides = [
    {
      title: "Discover the Latest Deals –",
      highlight: "Up to 50% Off!",
      subtitle: "Shop trending fashion, high-end electronics & daily lifestyle essentials.",
      link: "/products",
      bgImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&auto=format&fit=crop&q=80",
    },
    {
      title: "Next-Gen Tech & Electronics –",
      highlight: "Mega Flash Deals!",
      subtitle: "Upgrade your gadgets with exclusive limited-time discounts.",
      link: "/products?category=electronic",
      bgImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80",
    },
    {
      title: "Exclusive Winter Collection –",
      highlight: "Special 40% Off!",
      subtitle: "Stay warm and stylish with the newest premium winter streetwear.",
      link: "/products?category=fashion",
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
    },
  ];

  const heroSlides = liveHeroBanners.length > 0
    ? liveHeroBanners.map((b) => ({
        title: b.title,
        highlight: "",
        subtitle: b.subtitle || "Exclusive platform promotions and discounts.",
        link: b.link || "/products",
        bgImage: b.image?.url || defaultHeroSlides[0].bgImage,
      }))
    : defaultHeroSlides;

  // Auto slide hero carousel every 5 seconds (pauses on hover)
  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroPaused, heroSlides.length]);

  // Ensure heroSlide index remains valid
  const currentSlideIndex = heroSlide % heroSlides.length;
  const currentHeroSlide = heroSlides[currentSlideIndex] || defaultHeroSlides[0];

  // Default Categories Fallback if database is fresh
  const defaultCategories = [
    { name: "Grocery", slug: "grocery", icon: "🧺", image: { url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300" } },
    { name: "Home", slug: "home", icon: "🛋️", image: { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300" } },
    { name: "Fashion", slug: "fashion", icon: "👔", image: { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300" } },
    { name: "Electronic", slug: "electronic", icon: "💻", image: { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" } },
    { name: "Toys", slug: "toys", icon: "🧸", image: { url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300" } },
    { name: "Beauty", slug: "beauty", icon: "💄", image: { url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300" } },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Filter or Slice Products for Sections
  const trendingProducts = products.length > 0 ? products.slice(0, 3) : [
    {
      _id: "p1",
      slug: "radiant-glow-hydrating-serum",
      title: "Radiant Glow Hydrating Serum",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 29.99,
      basePrice: 39.99,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600" }],
    },
    {
      _id: "p2",
      slug: "modern-minimalist-vase",
      title: "Modern Minimalist Vase",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 40.99,
      basePrice: 40.99,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600" }],
    },
    {
      _id: "p3",
      slug: "fitpro-3000-smartwatch",
      title: "FitPro 3000 Smartwatch",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 119.99,
      basePrice: 149.99,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" }],
    },
  ];

  const limitedDeals = products.length > 3 ? products.slice(3, 8) : [
    {
      _id: "d1",
      slug: "samsung-galaxy-s24",
      title: "Samsung Galaxy S24",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 799.99,
      basePrice: 1100.99,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600" }],
    },
    {
      _id: "d2",
      slug: "ui-tws-7002-earbud",
      title: "Ui Tws 7002 Earbud",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 149.00,
      basePrice: 200.00,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600" }],
    },
    {
      _id: "d3",
      slug: "winter-fashion-jacket",
      title: "Winter fashion jacket",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 250.99,
      basePrice: 500.00,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=600" }],
    },
    {
      _id: "d4",
      slug: "new-balance-574-senekers",
      title: "New Balance 574 Senekers",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 300.00,
      basePrice: 400.00,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600" }],
    },
    {
      _id: "d5",
      slug: "ui-tws-7002-mini",
      title: "Ui Tws 7002",
      description: "Gentle yet effective, our Radiance Boosting Foaming...",
      discountPrice: 49.99,
      basePrice: 79.99,
      ratings: 5.0,
      numReviews: 342,
      images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" }],
    },
  ];

  const fallbackBestSellers = [
    {
      _id: "bs1",
      slug: "ui-tws-7002-mini",
      title: "Ui Tws 7002 Wireless Noise-Cancelling Earbuds",
      category: { name: "Electronics" },
      discountPrice: 500,
      basePrice: 800,
      ratings: 5.0,
      numReviews: 342,
      soldCount: 145,
      images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs2",
      slug: "winter-fashion-jacket",
      title: "Premium Waterproof Streetwear Winter Jacket",
      category: { name: "Fashion" },
      discountPrice: 1000,
      basePrice: 1600,
      ratings: 4.9,
      numReviews: 218,
      soldCount: 98,
      images: [{ url: "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs3",
      slug: "jedel-k500-rgb-gaming-keyboard",
      title: "JEDEL K500 RGB Mechanical Gaming Keyboard",
      category: { name: "Accessories" },
      discountPrice: 600,
      basePrice: 1200,
      ratings: 4.8,
      numReviews: 189,
      soldCount: 84,
      images: [{ url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs4",
      slug: "fitpro-3000-smartwatch",
      title: "FitPro 3000 AMOLED Fitness Smartwatch",
      category: { name: "Wearables" },
      discountPrice: 1200,
      basePrice: 1800,
      ratings: 4.9,
      numReviews: 412,
      soldCount: 162,
      images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs5",
      slug: "wild-stone-edge-premium-perfume",
      title: "Wild Stone - Edge Premium Long Lasting Perfume",
      category: { name: "Fragrances" },
      discountPrice: 600,
      basePrice: 1300,
      ratings: 5.0,
      numReviews: 135,
      soldCount: 76,
      images: [{ url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs6",
      slug: "new-balance-574-senekers",
      title: "New Balance 574 Casual Urban Athletic Sneakers",
      category: { name: "Footwear" },
      discountPrice: 300,
      basePrice: 400,
      ratings: 4.8,
      numReviews: 95,
      soldCount: 65,
      images: [{ url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs7",
      slug: "premium-hifi-headphones",
      title: "Studio Pro ANC Wireless Over-Ear Headphones",
      category: { name: "Audio" },
      discountPrice: 2200,
      basePrice: 3500,
      ratings: 4.9,
      numReviews: 310,
      soldCount: 120,
      images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      _id: "bs8",
      slug: "radiant-glow-hydrating-serum",
      title: "Radiant Glow Organic Vitamin C Daily Serum",
      category: { name: "Skincare" },
      discountPrice: 490,
      basePrice: 750,
      ratings: 5.0,
      numReviews: 240,
      soldCount: 110,
      images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80" }],
    },
  ];

  const bestSellingProducts = useMemo(() => {
    if (products && products.length > 0) {
      // Sort database products by soldCount descending, then ratings descending
      const sorted = [...products].sort(
        (a, b) => (b.soldCount || 0) - (a.soldCount || 0) || (b.ratings || 0) - (a.ratings || 0)
      );
      if (sorted.length >= 8) {
        return sorted.slice(0, 8);
      }
      const existingSlugs = new Set(sorted.map((p) => p.slug || p._id));
      const remainingNeeded = 8 - sorted.length;
      const additional = fallbackBestSellers.filter((f) => !existingSlugs.has(f.slug)).slice(0, remainingNeeded);
      return [...sorted, ...additional];
    }
    return fallbackBestSellers;
  }, [products]);

  return (
    <div className="space-y-12 pb-20 bg-[#FAF9F6] text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO BANNER SLIDER CONNECTED TO CMS */}
      <section
        className="relative overflow-hidden bg-[#072421] min-h-[380px] sm:min-h-[460px] flex items-center group"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out"
          style={{ backgroundImage: `url('${currentHeroSlide.bgImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#072421] via-[#0B3530]/90 sm:via-[#0B3530]/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full py-16">
          <div className="max-w-xl space-y-4 text-white">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {currentHeroSlide.title}{" "}
              {currentHeroSlide.highlight && (
                <span className="italic block mt-1 text-[#C8E6C9]">
                  {currentHeroSlide.highlight}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-md">
              {currentHeroSlide.subtitle}
            </p>
            <div className="pt-2">
              <Link
                to={currentHeroSlide.link || "/products"}
                className="inline-block px-8 py-3 bg-[#EAF5E9] hover:bg-[#D7ECD5] text-[#1A382B] text-xs font-black rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {heroSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setHeroSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
              }
              aria-label="Previous Slide"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-slate-100 text-slate-900 shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 z-20"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() =>
                setHeroSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
              }
              aria-label="Next Slide"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-slate-100 text-slate-900 shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 z-20"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Carousel Dots Indicators */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? "w-8 bg-[#C8E6C9]"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. PROMOTIONAL FEATURED GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Column 1: New Year! New Fashion (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between group">
            <div className="space-y-1 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {middleBanners[0]?.title || "Men's Premium Winter Collection"}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {middleBanners[0]?.subtitle || "New Year! New Fashion"}
              </h3>
            </div>

            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#EBF3FA] flex items-center justify-center my-2 p-2">
              <img
                src={
                  middleBanners[0]?.image?.url ||
                  "https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=600&auto=format&fit=crop&q=80"
                }
                alt="Winter Fashion"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              <Link
                to={middleBanners[0]?.link || "/products?category=fashion"}
                className="absolute bottom-3.5 px-7 py-2 rounded-full bg-[#EAF5E9] hover:bg-[#D7ECD5] text-[#1A382B] text-xs font-black shadow-md transition-transform active:scale-95"
              >
                Shop Now
              </Link>
            </div>
          </div>

          {/* Column 2: Gaming accessories 2x2 (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Gaming accessories
              </h3>
              <Link
                to="/products?category=electronic"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                See more
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Headsets */}
              <Link
                to="/products?search=headset"
                className="bg-slate-50/80 hover:bg-slate-100/90 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col items-center justify-between group/sub text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=250&auto=format&fit=crop&q=80"
                    alt="Headsets"
                    className="max-h-full max-w-full object-contain group-hover/sub:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover/sub:text-blue-600">
                  Headsets
                </span>
              </Link>

              {/* Mouse */}
              <Link
                to="/products?search=mouse"
                className="bg-slate-50/80 hover:bg-slate-100/90 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col items-center justify-between group/sub text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=250&auto=format&fit=crop&q=80"
                    alt="Mouse"
                    className="max-h-full max-w-full object-contain group-hover/sub:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover/sub:text-blue-600">
                  Mouse
                </span>
              </Link>

              {/* Controller */}
              <Link
                to="/products?search=controller"
                className="bg-slate-50/80 hover:bg-slate-100/90 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col items-center justify-between group/sub text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=250&auto=format&fit=crop&q=80"
                    alt="Controller"
                    className="max-h-full max-w-full object-contain group-hover/sub:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover/sub:text-blue-600">
                  Controller
                </span>
              </Link>

              {/* Chair */}
              <Link
                to="/products?search=chair"
                className="bg-slate-50/80 hover:bg-slate-100/90 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col items-center justify-between group/sub text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
                  <img
                    src="https://images.unsplash.com/photo-1598550476439-6847785fdd52?w=250&auto=format&fit=crop&q=80"
                    alt="Chair"
                    className="max-h-full max-w-full object-contain group-hover/sub:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover/sub:text-blue-600">
                  Chair
                </span>
              </Link>
            </div>
          </div>

          {/* Column 3: Stacked Right Promos (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            {/* Top 2 Cards: BE THE WINNER & Redmi Y3 */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Box A: BE THE WINNER */}
              <Link
                to="/products?category=laptop"
                className="relative rounded-3xl overflow-hidden p-3.5 bg-gradient-to-br from-[#4A0E17] via-[#2A080E] to-black text-white border border-red-900/30 flex flex-col justify-between group shadow-xs hover:border-red-500/50 transition-all min-h-[120px]"
              >
                <div className="relative z-10 space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-red-300 tracking-wider block">
                    BE THE
                  </span>
                  <h4 className="text-xs font-black tracking-tight text-white leading-tight">
                    WINNER
                  </h4>
                  <p className="text-[10px] font-black text-amber-300">
                    ৳109,900
                  </p>
                </div>
                <div className="my-1 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=250&auto=format&fit=crop&q=80"
                    alt="Gaming Laptop"
                    className="w-16 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[9px] font-bold text-red-200 group-hover:underline">
                  More details →
                </span>
              </Link>

              {/* Box B: Redmi Y3 */}
              <Link
                to="/products?category=mobil"
                className="relative rounded-3xl overflow-hidden p-3.5 bg-gradient-to-br from-[#1A237E] via-[#0D1642] to-black text-white border border-blue-900/30 flex flex-col justify-between group shadow-xs hover:border-blue-500/50 transition-all min-h-[120px]"
              >
                <div className="relative z-10 space-y-0.5">
                  <span className="text-[8px] font-bold uppercase text-amber-400 tracking-wider block">
                    NEW LAUNCH
                  </span>
                  <h4 className="text-xs font-black tracking-tight text-white leading-tight">
                    Redmi Y3
                  </h4>
                  <p className="text-[10px] font-medium text-slate-300">
                    Blue Edition
                  </p>
                </div>
                <div className="my-1 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=250&auto=format&fit=crop&q=80"
                    alt="Smartphone"
                    className="w-14 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-[9px] font-bold text-blue-200 group-hover:underline">
                  View More →
                </span>
              </Link>
            </div>

            {/* Bottom Card: Philips 4K Ambilight TV */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 group">
              <div className="w-24 sm:w-28 h-20 shrink-0 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&auto=format&fit=crop&q=80"
                  alt="Philips 4K TV"
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 space-y-1">
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-900 text-white uppercase tracking-wider">
                  $50 OFF
                </span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  Philips 4K Ambilight TV
                </h4>
                <p className="text-xs sm:text-sm font-black text-slate-900">
                  ৳75,000
                </p>
                <Link
                  to="/products?category=electronic"
                  className="inline-block mt-1 px-4 py-1.5 rounded-full bg-[#EAF5E9] hover:bg-[#D7ECD5] text-[#1A382B] text-[11px] font-bold shadow-xs transition-all active:scale-95"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bottom Visual Promo Banners */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5">
          {/* Banner 1: Trousers Fashion */}
          <Link
            to="/products?category=man-product"
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] bg-slate-900 border border-slate-200/80 shadow-xs flex items-end p-3 sm:p-4"
          >
            <img
              src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80"
              alt="Trousers Fashion"
              className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10">
              <span className="text-[10px] font-semibold text-slate-300 uppercase block">Comfy Fit</span>
              <span className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-md">
                Trousers Fashion
              </span>
            </div>
          </Link>

          {/* Banner 2: Men's Fashion (Watch) */}
          <Link
            to="/products?category=fashion&search=watch"
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] bg-slate-900 border border-slate-200/80 shadow-xs flex items-end p-3 sm:p-4"
          >
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80"
              alt="Men's Fashion Watch"
              className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-semibold text-amber-300 uppercase block">DONG HO NAM</span>
              <span className="text-xs sm:text-sm font-black text-white leading-tight block drop-shadow-md">
                MEN'S FASHION
              </span>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs">
                Shop Now →
              </span>
            </div>
          </Link>

          {/* Banner 3: Denim */}
          <Link
            to="/products?category=fashion&search=denim"
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] bg-slate-100 border border-slate-200/80 shadow-xs flex items-center justify-center p-3 sm:p-4 text-center"
          >
            <img
              src="https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=80"
              alt="Denim"
              className="absolute inset-0 w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase block">
                DENIM
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-300 block font-semibold">
                Classic Essentials
              </span>
            </div>
          </Link>

          {/* Banner 4: Philips Domestic Appliances */}
          <Link
            to="/products?category=home-living"
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] bg-sky-50 border border-slate-200/80 shadow-xs flex items-end p-3 sm:p-4"
          >
            <img
              src="https://images.unsplash.com/photo-1585336261026-6d654272161f?w=500&auto=format&fit=crop&q=80"
              alt="Philips Appliances"
              className="absolute inset-0 w-full h-full object-cover brightness-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10 space-y-1">
              <span className="text-xs sm:text-sm font-black text-white leading-tight block drop-shadow-md">
                PHILIPS
              </span>
              <span className="text-[10px] text-slate-200 block font-medium">
                Domestic Appliances
              </span>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs">
                Shop Now →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Trending Product</h2>
          <Link to="/products" className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 shadow-xs transition-colors">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          {/* 3 Main Product Cards */}
          {isLoading ? (
            <>{[1, 2, 3].map((i) => <ShimmerCard key={i} />)}</>
          ) : trendingProducts.map((p) => {
            const imgUrl = p.images?.[0]?.url || "https://placehold.co/400x400?text=Product";
            const currentPrice = Number(p.discountPrice || p.price || p.basePrice || 0);
            const originalPrice = Number(p.basePrice || p.price || currentPrice);
            const isDiscount = originalPrice > currentPrice;
            const discountPct = isDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

            return (
              <div key={p._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between group hover:border-slate-300 transition-all">
                <div className="relative w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-3">
                  <img src={imgUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <button
                    type="button"
                    onClick={(e) => handleWishlist(p, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center text-xs shadow-xs transition-colors"
                  >
                    ♡
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={p.title}>
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold pt-1">
                    <span>★★★★★</span>
                    <span className="text-slate-400 font-normal">({p.numReviews || 342} reviews)</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-extrabold text-sm text-emerald-600">৳{currentPrice.toLocaleString()}</span>
                    {isDiscount && (
                      <>
                        <span className="text-xs text-slate-400 line-through">৳{originalPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {discountPct}% Off
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <Link to={`/products/${p.slug || p._id}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                    View Details
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(p, e)}
                    className="px-3.5 py-1.5 bg-[#38A169] hover:bg-[#2F855A] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            );
          })}

          {/* Trend Collection for Men Side Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Trend collection for men</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[9px] text-slate-400 block">৳2,595</span>
                <img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=150" alt="Pants" className="w-12 h-12 mx-auto object-contain my-1" />
                <Link to="/products?category=fashion" className="text-indigo-600 font-bold hover:underline">Buy Now</Link>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150" alt="Tshirt" className="w-12 h-12 mx-auto object-contain my-1" />
                <Link to="/products?category=fashion" className="text-indigo-600 font-bold hover:underline">Buy Now</Link>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[9px] text-slate-400 block">৳10,400</span>
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150" alt="Sneakers" className="w-12 h-12 mx-auto object-contain my-1" />
                <Link to="/products?category=fashion" className="text-indigo-600 font-bold hover:underline">Buy Now</Link>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[9px] text-slate-400 block">৳1,050</span>
                <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150" alt="Cap" className="w-12 h-12 mx-auto object-contain my-1" />
                <Link to="/products?category=fashion" className="text-indigo-600 font-bold hover:underline">Buy Now</Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. START EXPLORING NOW (CATEGORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Start exploring now</h2>
          <Link to="/products" className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 shadow-xs transition-colors">
            View All
          </Link>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {displayCategories.map((cat, idx) => {
              const catImg = cat.image?.url || "https://placehold.co/150x150?text=Category";
              return (
                <Link
                  key={cat._id || idx}
                  to={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all text-center group"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 overflow-hidden flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform">
                    <img src={catImg} alt={cat.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BEST SELLING PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200/60 shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Best Selling Products
            </h2>
            <p className="text-xs text-slate-500 max-w-md">
              Discover our top-rated, most-purchased items loved by verified shoppers.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all self-start sm:self-auto group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {isLoading ? (
            <>{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ShimmerCard key={i} />)}</>
          ) : (
            bestSellingProducts.map((p, index) => {
              const imgUrl =
                p.images?.find((img) => img.isThumbnail)?.url ||
                p.images?.[0]?.url ||
                "https://placehold.co/400x400?text=Product";
              const currentPrice = Number(p.discountPrice || p.price || p.basePrice || 0);
              const originalPrice = Number(p.basePrice || p.price || currentPrice);
              const isDiscount = originalPrice > currentPrice;
              const discountPct = isDiscount
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                : 0;
              const categoryName = p.category?.name || p.category || "Top Product";
              const soldTotal = p.soldCount || (index === 0 ? 34 : (index + 1) * 9);

              return (
                <div
                  key={p._id || p.slug || index}
                  className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col justify-between overflow-hidden p-3 sm:p-4 relative"
                >
                  {/* Media Container */}
                  <div>
                    <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-slate-50/80 overflow-hidden mb-3 border border-slate-100 group-hover:border-slate-200 transition-colors flex items-center justify-center">
                      <Link to={`/products/${p.slug || p._id}`} className="block w-full h-full">
                        <img
                          src={imgUrl}
                          alt={p.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
                        {index < 3 ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <span>★</span>
                            <span>#{index + 1} Best Seller</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold tracking-tight shadow-xs flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                            <span>Popular</span>
                          </span>
                        )}

                        {isDiscount && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => handleWishlist(p, e)}
                        title="Save to Wishlist"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 flex items-center justify-center shadow-xs transition-all z-10 cursor-pointer active:scale-90"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Category & Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-400 uppercase tracking-wider truncate max-w-[65%]">
                          {categoryName}
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                          {soldTotal} sold
                        </span>
                      </div>

                      <Link
                        to={`/products/${p.slug || p._id}`}
                        className="block group-hover:text-[#166534] transition-colors"
                      >
                        <h3
                          className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug"
                          title={p.title}
                        >
                          {p.title}
                        </h3>
                      </Link>

                      {/* Rating Row */}
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 pt-0.5">
                        <div className="flex items-center">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <span className="font-extrabold text-slate-800 text-[11px]">
                          {Number(p.ratings || 5.0).toFixed(1)}
                        </span>
                        <span className="text-slate-400 text-[10px] font-normal">
                          ({p.numReviews || 12})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 mt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ৳{currentPrice.toLocaleString()}
                        </span>
                        {isDiscount && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            ৳{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(p, e)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#166534] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. LIMITED-TIME DEALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Limited-Time Deal</h2>
          <Link to="/products" className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 shadow-xs transition-colors">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading ? (
            <>{[1, 2, 3, 4, 5].map((i) => <ShimmerCard key={i} />)}</>
          ) : limitedDeals.map((p) => {
            const imgUrl = p.images?.[0]?.url || "https://placehold.co/400x400?text=Deal";
            const currentPrice = Number(p.discountPrice || p.price || p.basePrice || 0);
            const originalPrice = Number(p.basePrice || p.price || currentPrice);
            const isDiscount = originalPrice > currentPrice;
            const discountPct = isDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

            return (
              <div key={p._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between group hover:border-slate-300 transition-all">
                <div className="relative w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2.5">
                  <img src={imgUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <button
                    type="button"
                    onClick={(e) => handleWishlist(p, e)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center text-xs shadow-xs transition-colors"
                  >
                    ♡
                  </button>
                  {isDiscount && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                      {discountPct}% Off
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-slate-900 truncate" title={p.title}>
                    {p.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold pt-0.5">
                    <span>★★★★★</span>
                    <span className="text-slate-400 font-normal">({p.numReviews || 342})</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-extrabold text-xs text-emerald-600">৳{currentPrice.toLocaleString()}</span>
                    {isDiscount && (
                      <span className="text-[10px] text-slate-400 line-through">৳{originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>


                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                  <Link to={`/products/${p.slug || p._id}`} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                    View Details
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(p, e)}
                    className="px-2.5 py-1 bg-[#38A169] hover:bg-[#2F855A] text-white text-[11px] font-bold rounded-md shadow-xs transition-colors"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. OUR HAPPY CUSTOMERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-extrabold text-emerald-800 tracking-tight">
            Our Happy Customers
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Don't just take our word for it - see how our products and services have delighted customers across the globe, one experience at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "Emily R.",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
            {
              name: "John D.",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
            {
              name: "Ahmed M.",
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
            {
              name: "Alex T.",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
            {
              name: "Priya R.",
              avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
            {
              name: "David H.",
              avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
              review: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
            },
          ].map((c, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                  <div className="text-amber-500 text-[10px]">★★★★★</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{c.review}"
              </p>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <Link
            to="/register"
            className="inline-block px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider uppercase shadow-md transition-transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
