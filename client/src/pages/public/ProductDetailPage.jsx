import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  MessageCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Play,
  Share2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  Building,
  FileText,
  Video,
  Info,
  Clock,
  Send,
  X,
  Loader2,
  Package,
  Camera,
  CheckCircle2,
} from "lucide-react";
import {
  useGetProductBySlugQuery,
  useGetProductsQuery,
} from "../../features/products/productApi";
import VideoPlayer from "../../components/ui/VideoPlayer";


import {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useCheckReviewEligibilityQuery,
} from "../../features/reviews/reviewApi";
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useUploadImageMutation,
} from "../../features/user/userApi";
import {
  useGetOrCreateChatMutation,
  useSendMessageMutation,
} from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import { addToCart, setDirectBuyItem } from "../../features/cart/cartSlice";

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [getOrCreateChat, { isLoading: isStartingChat }] = useGetOrCreateChatMutation();
  const [sendMessageMutation] = useSendMessageMutation();
  const tabsSectionRef = useRef(null);
  const reviewFormRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Queries
  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug);
  const product = productResponse?.data?.product || productResponse?.product;

  const productId = product?._id || product?.id;
  const token = localStorage.getItem("easilia_token");

  const { data: reviewsResponse, refetch: refetchReviews } = useGetProductReviewsQuery(
    { productId },
    { skip: !productId }
  );
  const { data: eligibilityData } = useCheckReviewEligibilityQuery(productId, {
    skip: !productId || !token,
  });
  const canReview = Boolean(eligibilityData?.data?.canReview ?? eligibilityData?.canReview);

  const [createReviewMutation, { isLoading: isSubmittingReview }] = useCreateReviewMutation();
  const [uploadImageMutation] = useUploadImageMutation();

  const { data: relatedResponse } = useGetProductsQuery({
    category: product?.category?._id || product?.category || undefined,
    limit: 6,
  });
  const relatedProducts = relatedResponse?.data?.products || relatedResponse?.products || [];

  const { data: wishlistItems = [] } = useGetWishlistQuery(undefined, {
    skip: !localStorage.getItem("easilia_token"),
  });
  const [toggleWishlistMutation] = useToggleWishlistMutation();

  // Component UI State
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("specifications"); // "specifications" | "video" | "reviews" | "delivery" | "seller"
  const [toastMessage, setToastMessage] = useState("");
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [reviewVideo, setReviewVideo] = useState(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Reset scroll and selections when switching products
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSelectedImgIndex(0);
    setSelectedVariant(null);
    setQuantity(1);
  }, [slug]);

  // Parse images & variations
  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => (typeof img === "string" ? { url: img } : img));
    }
    return [{ url: "https://placehold.co/800x800?text=Product" }];
  }, [product]);

  const variants = useMemo(() => {
    if (product?.variants && product.variants.length > 0) return product.variants;
    return [];
  }, [product]);

  // Active Variant
  const activeVariant = selectedVariant || variants[0] || null;

  // Fully dynamic pricing and stock calculations based on activeVariant
  const { currentPrice, originalPrice, isDiscount, discountPct, currentStock } = useMemo(() => {
    // 1. Determine base regular price
    const varBase = Number(
      activeVariant?.price ||
      product?.basePrice ||
      product?.price ||
      0
    );

    // 2. Product-level discount ratio
    const prodBase = Number(product?.basePrice || product?.price || 0);
    const prodDiscount = Number(product?.discountPrice || 0);
    const hasProdDiscount = prodBase > 0 && prodDiscount > 0 && prodDiscount < prodBase;
    const discountRatio = hasProdDiscount ? prodDiscount / prodBase : 1;

    // 3. Determine variant discount price
    let varDiscount = null;
    if (
      activeVariant?.discountPrice !== undefined &&
      activeVariant?.discountPrice !== null &&
      Number(activeVariant.discountPrice) > 0 &&
      Number(activeVariant.discountPrice) < varBase
    ) {
      // Explicit valid variant discountPrice
      varDiscount = Number(activeVariant.discountPrice);
    } else if (hasProdDiscount) {
      // Apply proportional discount based on product discount rate
      varDiscount = Math.round(varBase * discountRatio);
    }

    const discountValid = varDiscount !== null && varDiscount > 0 && varDiscount < varBase;
    const effCurrentPrice = discountValid ? varDiscount : varBase;
    const effOriginalPrice = varBase;
    const effDiscountPct =
      discountValid && effOriginalPrice > 0
        ? Math.round(((effOriginalPrice - effCurrentPrice) / effOriginalPrice) * 100)
        : 0;

    const effStock =
      activeVariant?.stock !== undefined && activeVariant?.stock !== null
        ? Number(activeVariant.stock)
        : Number(product?.totalStock ?? 0);

    return {
      currentPrice: effCurrentPrice,
      originalPrice: effOriginalPrice,
      isDiscount: discountValid,
      discountPct: effDiscountPct,
      currentStock: effStock,
    };
  }, [product, activeVariant]);

  // Dynamic attribute label (e.g. COLOR, SIZE, OPTION)
  const variantOptionLabel = useMemo(() => {
    if (activeVariant?.attributes) {
      const keys = Object.keys(activeVariant.attributes).filter((k) => k !== "$init");
      if (keys.length > 0) return keys[0].toUpperCase();
    }
    return "OPTION";
  }, [activeVariant]);

  const totalStock = currentStock;
  const isWishlisted = wishlistItems.some((it) => (it._id || it.id || it) === productId);

  // Reviews data & dynamic distribution directly from backend
  const reviews = reviewsResponse?.data?.reviews || reviewsResponse?.reviews || [];
  const reviewCount =
    reviewsResponse?.data?.totalCount ??
    reviewsResponse?.totalCount ??
    product?.numReviews ??
    reviews.length ??
    0;
  const avgRating =
    reviewCount === 0
      ? 0.0
      : Number(
          product?.ratings ||
            (reviews.length > 0
              ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
              : 0)
        );

  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Video data
  const videoUrl = product?.videos?.[0]?.url || product?.videoUrl || "";

  // Toast notifier
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    const computedVariant = activeVariant
      ? {
          ...activeVariant,
          price: originalPrice,
          discountPrice: isDiscount ? currentPrice : undefined,
        }
      : null;

    dispatch(
      addToCart({
        product: {
          ...product,
          price: currentPrice,
          basePrice: originalPrice,
          discountPrice: isDiscount ? currentPrice : undefined,
        },
        quantity,
        variant: computedVariant,
      })
    );
    showToast(`Added ${quantity}x "${product.title}" (${activeVariant?.name || "Standard"}) to your cart!`);
  };

  // Buy Now (Direct Single Product Checkout)
  const handleBuyNow = () => {
    if (!product) return;
    const computedVariant = activeVariant
      ? {
          ...activeVariant,
          price: originalPrice,
          discountPrice: isDiscount ? currentPrice : undefined,
        }
      : null;

    dispatch(
      setDirectBuyItem({
        product: {
          ...product,
          price: currentPrice,
          basePrice: originalPrice,
          discountPrice: isDiscount ? currentPrice : undefined,
        },
        quantity,
        variant: computedVariant,
      })
    );
    navigate("/checkout?direct=true");
  };

  // Toggle Wishlist
  const handleToggleWishlist = async () => {
    if (!productId) return;
    try {
      await toggleWishlistMutation(productId).unwrap();
      showToast(isWishlisted ? "Removed from Wishlist" : "Saved to Wishlist!");
    } catch {
      showToast("Please sign in to save items to your wishlist.");
    }
  };

  // Instant Real-Time Chat with Seller
  const handleChatWithSeller = async () => {
    if (!isAuthenticated && !token && !user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const shopOwnerId = product?.shop?.owner?._id || product?.shop?.owner;
    const currentUserId = user?._id || user?.id;
    if (currentUserId && shopOwnerId && currentUserId.toString() === shopOwnerId.toString()) {
      showToast("You are the owner of this shop.");
      return;
    }

    const shopId = product?.shop?._id || product?.shop?.id || product?.shop;
    if (!shopId) {
      showToast("Merchant information is currently unavailable.");
      return;
    }

    try {
      const res = await getOrCreateChat({
        shopId: shopId.toString(),
        productId: product?._id,
      }).unwrap();

      const chat = res?.data?.chat || res?.chat;
      const chatId = chat?._id;

      if (chatId) {
        // Send initial inquiry card snapshot
        const thumbnail =
          product?.images?.find((img) => img.isThumbnail)?.url ||
          product?.images?.[0]?.url ||
          "";

        try {
          await sendMessageMutation({
            chatId,
            content: `Hi, I am inquiring about "${product.title}". Is this available?`,
            product: {
              product: product._id,
              title: product.title,
              slug: product.slug,
              price: product.discountPrice || product.basePrice,
              thumbnail,
            },
          }).unwrap();
        } catch {
          // Continue to chat even if auto-greeting is duplicate
        }

        navigate(`/user/messages?chatId=${chatId}`);
      }
    } catch (err) {
      console.error("Failed to connect with seller:", err);
      showToast(err?.data?.message || "Could not open chat with seller.");
    }
  };

  // Share Product
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!");
    }
  };

  // Scroll to video tab
  const handleOpenVideoTab = () => {
    setActiveTab("video");
    tabsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rating dynamic helper
  const getRatingLabel = (rating) => {
    switch (rating) {
      case 5:
        return "★★★★★ Excellent";
      case 4:
        return "★★★★☆ Good";
      case 3:
        return "★★★☆☆ Average";
      case 2:
        return "★★☆☆☆ Poor";
      case 1:
        return "★☆☆☆☆ Terrible";
      default:
        return "★★★★★ Excellent";
    }
  };

  // Upload Photos (up to 5)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (reviewPhotos.length + files.length > 5) {
      showToast("You can upload a maximum of 5 product photos.");
      return;
    }

    setIsUploadingPhotos(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Photo "${file.name}" exceeds 10MB limit.`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadImageMutation(formData).unwrap();
        const url = res?.url || res?.path || "";
        const path = res?.path || "";
        if (url) {
          setReviewPhotos((prev) => [...prev, { url, path }]);
        }
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      showToast("Failed to upload some photos.");
    } finally {
      setIsUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setReviewPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload Review Video (Max 100MB)
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast("Video file exceeds 100MB limit.");
      return;
    }

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadImageMutation(formData).unwrap();
      const url = res?.url || res?.path || "";
      const path = res?.path || "";
      if (url) {
        setReviewVideo({ url, path, name: file.name });
      }
    } catch (err) {
      console.error("Video upload error:", err);
      showToast("Failed to upload video.");
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    setReviewVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleToggleReviewForm = () => {
    setIsReviewFormOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      return next;
    });
  };

  // Submit Verified Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!productId) return;
    if (!reviewComment.trim()) {
      showToast("Please provide a detailed review comment.");
      return;
    }

    try {
      await createReviewMutation({
        productId,
        rating: ratingInput,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        images: reviewPhotos.map((p) => ({ url: p.url, path: p.path || "" })),
        video: reviewVideo?.url ? { url: reviewVideo.url, path: reviewVideo.path || "" } : undefined,
      }).unwrap();

      showToast("Thank you! Verified review submitted successfully.");
      setIsReviewFormOpen(false);
      setReviewComment("");
      setReviewTitle("");
      setReviewPhotos([]);
      setReviewVideo(null);
      setRatingInput(5);
      refetchReviews();
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to submit review");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#166534]" />
        <p className="text-sm font-semibold text-slate-500">Loading product details from server...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-2xl text-slate-400">
          <Package className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Product Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested product could not be found or has been removed from our catalog.
        </p>
        <Link
          to="/products"
          className="inline-block px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Return to Products
        </Link>
      </div>
    );
  }

  const sellerName = product.shop?.name || "Bishal Biswas's Shop";
  const categoryName = product.category?.name || product.category || "Electronics";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. Breadcrumb Navigation                                                  */}
      {/* ========================================================================= */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link to="/products" className="hover:text-slate-900 transition-colors">
            Products
          </Link>
          <span>&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-1 max-w-md">
            {product.title}
          </span>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 1. Main Product Card Container (Gallery Left + Buy Box Right)             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Media Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Hero Image */}
          <div className="relative w-full aspect-square rounded-3xl bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center group">
            <img
              src={images[selectedImgIndex]?.url || images[0]?.url}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Top-Left Discount Badge */}
            {isDiscount && (
              <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-black tracking-wide shadow-xs">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Horizontal Thumbnails Carousel */}
          {images.length > 1 && (
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImgIndex === idx
                        ? "border-[#166534] shadow-xs scale-105"
                        : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Product Buy Box (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Seller Store Link */}
            <div>
              <Link
                to={`/shops/${product.shop?.slug || product.shop?._id || ""}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#166534] dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Building className="w-3.5 h-3.5" />
                <span>{sellerName}</span>
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              </Link>
            </div>

            {/* Product Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
              {product.title}
            </h1>

            {/* Rating & Video Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span>{avgRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({reviewCount} reviews)</span>
              </div>

              <button
                type="button"
                onClick={handleOpenVideoTab}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-purple-600" />
                <span>Watch Video</span>
              </button>
            </div>

            {/* Pricing Row */}
            <div className="flex flex-wrap items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                ৳{currentPrice.toLocaleString()}
              </span>
              {isDiscount && (
                <span className="text-base sm:text-lg text-slate-400 line-through font-medium">
                  ৳{originalPrice.toLocaleString()}
                </span>
              )}
              {isDiscount && (
                <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-extrabold border border-rose-200">
                  Save {discountPct}%
                </span>
              )}
              {quantity > 1 && (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                  Total: ৳{(currentPrice * quantity).toLocaleString()} ({quantity} × ৳{currentPrice.toLocaleString()})
                </span>
              )}
            </div>

            {/* In Stock Badge */}
            <div>
              {totalStock > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  In Stock ({totalStock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Variation / Option Selector */}
            {variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {variantOptionLabel}:{" "}
                  <span className="text-slate-900 dark:text-white font-black">
                    {activeVariant?.name}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isSelected = activeVariant?.name === v.name;
                    // Calculate preview dynamic price for this variant
                    const vBase = Number(v.price || product?.basePrice || 0);
                    const prodBase = Number(product?.basePrice || 0);
                    const prodDisc = Number(product?.discountPrice || 0);
                    const hasDisc = prodBase > 0 && prodDisc > 0 && prodDisc < prodBase;
                    let vPrice = vBase;
                    if (
                      v.discountPrice !== undefined &&
                      v.discountPrice !== null &&
                      Number(v.discountPrice) > 0 &&
                      Number(v.discountPrice) < vBase
                    ) {
                      vPrice = Number(v.discountPrice);
                    } else if (hasDisc) {
                      vPrice = Math.round(vBase * (prodDisc / prodBase));
                    }

                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v);
                          const vStock = v.stock !== undefined ? Number(v.stock) : (product?.totalStock ?? 0);
                          if (quantity > vStock && vStock > 0) {
                            setQuantity(1);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? "bg-white text-slate-900 border-[#166534] ring-2 ring-[#166534]/20 font-black shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <span>{v.name}</span>
                        {vPrice > 0 && (
                          <span
                            className={`text-[11px] font-semibold ${
                              isSelected ? "text-[#166534]" : "text-slate-400"
                            }`}
                          >
                            ৳{vPrice.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Main Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2.5 text-xs font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-950 min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(totalStock > 0 ? totalStock : 1, quantity + 1))}
                  className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 px-8 py-3 rounded-2xl bg-[#5C45FD] hover:bg-[#4d38f0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                title="Save to Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "fill-rose-600 text-rose-600" : ""
                  }`}
                />
              </button>
            </div>

            {/* Chat with Seller Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleChatWithSeller}
                disabled={isStartingChat}
                className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 text-[#166534] dark:text-emerald-400 font-bold text-xs sm:text-sm border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Connecting to Seller...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat with Seller ({sellerName})</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Value Guarantee 3-Card Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-2xl text-center space-y-0.5 border border-slate-200/60 dark:border-slate-800">
              <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fast Delivery</p>
              <p className="text-[10px] text-slate-400">Within 24-48 hrs</p>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-2xl text-center space-y-0.5 border border-slate-200/60 dark:border-slate-800">
              <RotateCcw className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">7 Days Return</p>
              <p className="text-[10px] text-slate-400">Easy & Free</p>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-2xl text-center space-y-0.5 border border-slate-200/60 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Authentic</p>
              <p className="text-[10px] text-slate-400">Verified Seller</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Five-Tab Section (Specifications, Video, Reviews, Delivery, Seller)     */}
      {/* ========================================================================= */}
      <div
        ref={tabsSectionRef}
        className="bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6"
      >
        {/* Tab Headers */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
          {[
            { id: "specifications", label: "Specifications & Overview", icon: FileText },
            { id: "video", label: "Video Demo", icon: Video },
            { id: "reviews", label: `Reviews & Ratings (${reviewCount})`, icon: Star },
            { id: "delivery", label: "Delivery & Returns", icon: Truck },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#166534] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Specifications & Overview */}
        {activeTab === "specifications" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-xs sm:text-sm">
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Product Description
              </h3>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description ||
                  `Manufacturer: Google
Android Version: 16
Display Ram: 16GB, Rom: 256GB
Real Ram: 2GB, Rom: 16GB
TF Card: Support 4GB/8GB/16GB/32GB/64GB
Wi-Fi Supports: 2GHz | 5GHz, Bluetooth 5.0
Processors: Allwiner H313 Quad Core 4X Cortex-A53@1.30 GHz
Clock Speed: 480 MHz, GPU Vendor: ARM Mali-G31
Google Play Store, Support Skype, MSN, Facebook, Email, Office Suit Etc
Bluetooth & Voice Remote: YES
Screen Mirroring: Miracast
Toffee, YouTube, 1000+ Free Live TV Channel
All Kinds of Sports Channel Free
Disney+, Netflix, Prime Video (Subscriptions Required)
Port: USB, TF, HDMI, AV, LAN-1
Power Adapter: 5V 2A
Product of CHINA`}
              </div>
            </div>

            {/* Key Specifications Table */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                KEY SPECIFICATIONS
              </h4>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 w-1/3">Attribute</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Category</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{categoryName}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Stock Availability</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{totalStock} units in stock</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Available Variations</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        Color ({variants.map((v) => v.name).join(", ")})
                      </td>
                    </tr>
                    {product.brand && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Brand</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {product.brand?.name || product.brand}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Video Demo */}
        {activeTab === "video" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Product Demonstration & Video Showcase
            </h3>
            {videoUrl ? (
              <div className="w-full max-w-3xl">
                <VideoPlayer url={videoUrl} />
              </div>
            ) : (

              <div className="aspect-video w-full max-w-3xl rounded-3xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-white relative shadow-lg p-6 text-center">
                <Play className="w-16 h-16 text-purple-400 mb-2 hover:scale-110 transition-transform cursor-pointer" />
                <p className="text-sm font-bold">Official showcase for {product.title}</p>
                <p className="text-xs text-slate-400 mt-1">
                  High-definition hardware testing, unboxing, and verified feature overview
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews & Ratings */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Score Box */}
            <div className="bg-slate-50/70 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Score */}
              <div className="md:col-span-4 text-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0">
                <p className="text-5xl font-black text-slate-900 dark:text-white">
                  {avgRating.toFixed(1)}
                </p>
                <div className="flex items-center justify-center gap-1 text-amber-400 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400">Based on {reviewCount} verified reviews</p>
              </div>

              {/* Right Progress Bars */}
              <div className="md:col-span-8 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-6 font-bold text-slate-600 dark:text-slate-400">{star}★</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-4 text-right text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter & Leave Review Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Reviews are exclusive to verified purchasers who received this product.</span>
              </div>

              {canReview && !isReviewFormOpen && (
                <button
                  type="button"
                  onClick={handleToggleReviewForm}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Write a Review</span>
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* Write Verified Buyer Review & Upload Media Card (Exact Design)             */}
            {/* ========================================================================= */}
            {isReviewFormOpen && (
              <div
                ref={reviewFormRef}
                className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-200"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        Write Verified Buyer Review &amp; Upload Media
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Share your genuine experience with other shoppers. You can add up to 5 photos and 1 product video!
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      Verified Purchase
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Field 1: Overall Rating */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Overall Rating <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating || ratingInput);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingInput(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="cursor-pointer transition-transform hover:scale-115"
                            >
                              <Star
                                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                                  isFilled
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-amber-500">
                        {getRatingLabel(hoverRating || ratingInput)}
                      </span>
                    </div>
                  </div>

                  {/* Field 2: Review Headline / Summary */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Review Headline / Summary
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Premium quality, exceeded my expectations!"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Field 3: Detailed Review */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Detailed Review <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="What did you like or dislike about this product? How was the packaging, quality, and performance?"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Field 4: Media Upload 2-Card Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Left Card: Add Product Photos (X/5) */}
                    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Add Product Photos ({reviewPhotos.length}/5)</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Max 10MB each</span>
                      </div>

                      {/* Hidden Photo Input */}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      {/* Photos Row */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {reviewPhotos.map((p, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 group shrink-0 shadow-xs"
                          >
                            <img
                              src={p.url}
                              alt={`Review upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                              title="Remove photo"
                            >
                              <X className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                          </div>
                        ))}

                        {isUploadingPhotos && (
                          <div className="w-14 h-14 rounded-xl border border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col items-center justify-center text-emerald-600 shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin mb-1" />
                            <span className="text-[8px] font-bold">Uploading</span>
                          </div>
                        )}

                        {reviewPhotos.length < 5 && !isUploadingPhotos && (
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 text-slate-400 flex flex-col items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-bold">+ Photo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Card: Add Review Video (Max 100MB) */}
                    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Video className="w-4 h-4 text-purple-600" />
                          <span>Add Review Video (Max 100MB)</span>
                        </div>
                        <span className="text-[10px] text-slate-400">MP4, WebM, MOV</span>
                      </div>

                      {/* Hidden Video Input */}
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/mov"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />

                      {reviewVideo ? (
                        <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/70 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Video className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 truncate">
                              {reviewVideo.name || "Product Video Attached"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVideo}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Remove video"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isUploadingVideo ? (
                        <div className="py-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/30 flex items-center justify-center gap-2 text-purple-600 text-xs font-bold">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Video...</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300/80 dark:border-purple-800 bg-purple-50/20 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>Choose Video from Device</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview || isUploadingPhotos || isUploadingVideo}
                      className="px-6 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Submit Verified Review</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  No reviews yet for this product. Be the first verified buyer to leave one!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {rev.user?.name || "Verified Customer"}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {rev.title && (
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">
                        {rev.title}
                      </h4>
                    )}
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rev.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt="Buyer review"
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        ))}
                      </div>
                    )}
                    {rev.video?.url && (
                      <div className="pt-1 max-w-xs">
                        <video
                          src={rev.video.url}
                          controls
                          className="w-full rounded-xl max-h-48 bg-black"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Delivery & Returns */}
        {activeTab === "delivery" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Standard Delivery</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Delivery is handled directly by the nearby store or our trusted logistics network. Estimated arrival is <strong>24 to 48 hours</strong> from order confirmation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>7 Days Hassle-Free Returns</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                If the item is damaged, defective, or incorrect, you can request an easy exchange or full refund within 7 days of delivery.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. Related Products Carousel / Grid (Matching Design)                     */}
      {/* ========================================================================= */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Related Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedProducts.map((p) => {
              const imgUrl =
                p.images?.[0]?.url ||
                p.images?.[0] ||
                "https://placehold.co/400x400?text=Product";
              const pPrice = Number(p.discountPrice || p.price || p.basePrice || 0);

              return (
                <Link
                  key={p._id || p.slug}
                  to={`/products/${p.slug || p._id}`}
                  className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden mb-2">
                    <img
                      src={imgUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#166534]">
                      {p.title}
                    </h4>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block">
                      ৳{pPrice.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* 5. Report Issue Modal                                                     */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Product Issue</h3>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Our moderation team reviews reported listings within 24 hours to ensure marketplace authenticity.
            </p>
            <div className="space-y-2 text-xs">
              {["Inaccurate specifications", "Counterfeit or fake", "Damaged / misleading image", "Other"].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setIsReportModalOpen(false);
                    showToast("Thank you. Report received for review.");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
