import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  MessageSquare,
  Package,
  ExternalLink,
  Edit3,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Video,
  AlertCircle,
  Loader2,
  X,
  Search,
  Filter,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Clock,
  PlusCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import {
  useGetMyReviewsQuery,
  useGetPendingReviewsQuery,
  useCreateReviewMutation,
  useUpdateMyReviewMutation,
  useDeleteReviewMutation,
} from "../../features/reviews/reviewApi";
import { useUploadImageMutation } from "../../features/user/userApi";

export const MyReviewsPage = () => {
  // Queries
  const {
    data: reviewsResponse,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useGetMyReviewsQuery();
  const reviews = reviewsResponse?.data?.reviews || reviewsResponse?.reviews || [];

  const {
    data: pendingResponse,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useGetPendingReviewsQuery();
  const pendingItems = pendingResponse?.data?.pending || pendingResponse?.pending || [];

  // Mutations
  const [createReviewMutation, { isLoading: isSubmittingNew }] = useCreateReviewMutation();
  const [updateMyReviewMutation, { isLoading: isUpdating }] = useUpdateMyReviewMutation();
  const [deleteReviewMutation, { isLoading: isDeleting }] = useDeleteReviewMutation();
  const [uploadImageMutation] = useUploadImageMutation();

  // Primary Section Tab ("to_review" vs "reviewed")
  const [activeMainTab, setActiveMainTab] = useState("reviewed"); // Default to reviewed or to_review if reviews empty

  // Filter & Search inside "reviewed"
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Write New Review Modal State
  const [newReviewProduct, setNewReviewProduct] = useState(null); // Product object
  const [newRating, setNewRating] = useState(5);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newPhotos, setNewPhotos] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [isUploadingNewPhotos, setIsUploadingNewPhotos] = useState(false);
  const [isUploadingNewVideo, setIsUploadingNewVideo] = useState(false);
  const [newFormError, setNewFormError] = useState("");
  const newPhotoInputRef = useRef(null);
  const newVideoInputRef = useRef(null);

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editPhotos, setEditPhotos] = useState([]);
  const [editVideo, setEditVideo] = useState(null);
  const [isUploadingEditPhotos, setIsUploadingEditPhotos] = useState(false);
  const [isUploadingEditVideo, setIsUploadingEditVideo] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const editPhotoInputRef = useRef(null);
  const editVideoInputRef = useRef(null);

  // Delete Confirm Modal State
  const [reviewToDelete, setReviewToDelete] = useState(null);

  // Lightbox Media Preview State
  const [previewMedia, setPreviewMedia] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Rating descriptor helper
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

  // KPIs
  const totalCount = reviews.length;
  const pendingCount = pendingItems.length;
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1)
      : "0.0";
  const verifiedCount = reviews.filter((r) => r.isVerifiedPurchase).length;
  const mediaCount = reviews.filter(
    (r) => (r.images && r.images.length > 0) || r.video?.url
  ).length;

  // Filtered Reviews for "reviewed" tab
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pTitle = rev.product?.title?.toLowerCase() || "";
        const cText = rev.comment?.toLowerCase() || "";
        const rTitle = rev.title?.toLowerCase() || "";
        if (!pTitle.includes(q) && !cText.includes(q) && !rTitle.includes(q)) {
          return false;
        }
      }

      // 2. Tab filter
      if (selectedFilter === "5star") return rev.rating === 5;
      if (selectedFilter === "4star") return rev.rating === 4;
      if (selectedFilter === "3star_below") return (rev.rating || 5) <= 3;
      if (selectedFilter === "with_media")
        return (rev.images && rev.images.length > 0) || Boolean(rev.video?.url);

      return true;
    });
  }, [reviews, selectedFilter, searchQuery]);

  // Open Write Review Modal
  const handleOpenWriteReview = (product) => {
    setNewFormError("");
    setNewReviewProduct(product);
    setNewRating(5);
    setNewHoverRating(0);
    setNewTitle("");
    setNewComment("");
    setNewPhotos([]);
    setNewVideo(null);
  };

  // Submit New Review
  const handleSubmitNewReview = async (e) => {
    e.preventDefault();
    if (!newReviewProduct?._id) return;
    if (!newComment.trim()) {
      setNewFormError("Please provide a detailed review comment.");
      return;
    }

    setNewFormError("");
    try {
      await createReviewMutation({
        productId: newReviewProduct._id,
        rating: newRating,
        title: newTitle.trim() || undefined,
        comment: newComment.trim(),
        images: newPhotos.map((p) => ({ url: p.url, path: p.path || "" })),
        video: newVideo?.url ? { url: newVideo.url, path: newVideo.path || "" } : undefined,
      }).unwrap();

      showToast("Thank you! Your verified review has been submitted.");
      setNewReviewProduct(null);
      refetchReviews();
      refetchPending();
      setActiveMainTab("reviewed");
    } catch (err) {
      setNewFormError(err?.data?.message || err?.error || "Failed to submit review.");
    }
  };

  // Handle Photo Upload for New Review
  const handleNewPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (newPhotos.length + files.length > 5) {
      setNewFormError("You can upload a maximum of 5 product photos.");
      return;
    }

    setIsUploadingNewPhotos(true);
    setNewFormError("");
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setNewFormError(`Photo "${file.name}" exceeds 10MB limit.`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadImageMutation(formData).unwrap();
        const url = res?.url || res?.path || "";
        const path = res?.path || "";
        if (url) {
          setNewPhotos((prev) => [...prev, { url, path }]);
        }
      }
    } catch (err) {
      setNewFormError("Failed to upload some photos.");
    } finally {
      setIsUploadingNewPhotos(false);
      if (newPhotoInputRef.current) newPhotoInputRef.current.value = "";
    }
  };

  // Handle Video Upload for New Review
  const handleNewVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setNewFormError("Video file exceeds 100MB limit.");
      return;
    }

    setIsUploadingNewVideo(true);
    setNewFormError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadImageMutation(formData).unwrap();
      const url = res?.url || res?.path || "";
      const path = res?.path || "";
      if (url) {
        setNewVideo({ url, path, name: file.name });
      }
    } catch (err) {
      setNewFormError("Failed to upload video.");
    } finally {
      setIsUploadingNewVideo(false);
      if (newVideoInputRef.current) newVideoInputRef.current.value = "";
    }
  };

  // Open Edit Review Modal
  const handleOpenEdit = (rev) => {
    setEditFormError("");
    setEditingReview(rev);
    setEditRating(rev.rating || 5);
    setEditHoverRating(0);
    setEditTitle(rev.title || "");
    setEditComment(rev.comment || "");
    setEditPhotos(rev.images ? rev.images.map((img) => ({ url: img.url, path: img.path })) : []);
    setEditVideo(rev.video?.url ? { url: rev.video.url, path: rev.video.path || "", name: "Attached Video" } : null);
  };

  // Submit Edited Review
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    if (!editComment.trim()) {
      setEditFormError("Please provide a detailed review comment.");
      return;
    }

    setEditFormError("");
    try {
      await updateMyReviewMutation({
        id: editingReview._id,
        productId: editingReview.product?._id || editingReview.product,
        rating: editRating,
        title: editTitle.trim() || undefined,
        comment: editComment.trim(),
        images: editPhotos.map((p) => ({ url: p.url, path: p.path || "" })),
        video: editVideo?.url ? { url: editVideo.url, path: editVideo.path || "" } : null,
      }).unwrap();

      showToast("Review updated successfully!");
      setEditingReview(null);
      refetchReviews();
    } catch (err) {
      setEditFormError(err?.data?.message || "Failed to update review.");
    }
  };

  // Handle Photo Upload in Edit
  const handleEditPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (editPhotos.length + files.length > 5) {
      setEditFormError("You can upload a maximum of 5 product photos.");
      return;
    }

    setIsUploadingEditPhotos(true);
    setEditFormError("");
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setEditFormError(`Photo "${file.name}" exceeds 10MB limit.`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadImageMutation(formData).unwrap();
        const url = res?.url || res?.path || "";
        const path = res?.path || "";
        if (url) {
          setEditPhotos((prev) => [...prev, { url, path }]);
        }
      }
    } catch (err) {
      setEditFormError("Failed to upload some photos.");
    } finally {
      setIsUploadingEditPhotos(false);
      if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
    }
  };

  // Handle Video Upload in Edit
  const handleEditVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setEditFormError("Video file exceeds 100MB limit.");
      return;
    }

    setIsUploadingEditVideo(true);
    setEditFormError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadImageMutation(formData).unwrap();
      const url = res?.url || res?.path || "";
      const path = res?.path || "";
      if (url) {
        setEditVideo({ url, path, name: file.name });
      }
    } catch (err) {
      setEditFormError("Failed to upload video.");
    } finally {
      setIsUploadingEditVideo(false);
      if (editVideoInputRef.current) editVideoInputRef.current.value = "";
    }
  };

  // Handle Delete Review
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReviewMutation(reviewToDelete._id).unwrap();
      showToast("Review deleted successfully.");
      setReviewToDelete(null);
      refetchReviews();
      refetchPending();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete review.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#166534] text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner & Page Title */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold shadow-xs">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                My Reviews &amp; Ratings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Share your verified experiences, write reviews for purchases, and manage published ratings.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Button & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("to_review");
                if (pendingItems[0]?.product) {
                  handleOpenWriteReview(pendingItems[0].product);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write a Review ({pendingCount})</span>
            </button>
          )}

          {/* Quick KPI stats */}
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-base font-black text-slate-900 dark:text-white block">
                {totalCount}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Reviewed</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-base font-black text-amber-500 block">
                ★ {avgRating}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Avg Rating</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-base font-black text-emerald-600 block">
                {pendingCount}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">To Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Stepper / Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab("reviewed")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === "reviewed"
              ? "bg-[#166534] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>My Published Reviews ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("to_review")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === "to_review"
              ? "bg-[#166534] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>To Be Reviewed ({pendingCount})</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION A: TO BE REVIEWED TAB                                          */}
      {/* ========================================================================= */}
      {activeMainTab === "to_review" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {isLoadingPending ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Checking pending items...</p>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 p-12 sm:p-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  All Caught Up!
                </h3>
                <p className="text-xs text-slate-500">
                  You have reviewed all eligible products from your previous orders. Thank you for helping the community!
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore More Products</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingItems.map((item, idx) => {
                const p = item.product;
                const pImg =
                  p?.images?.[0]?.url ||
                  p?.images?.[0] ||
                  "https://placehold.co/200x200?text=Product";
                const pPrice = item.price || p?.discountPrice || p?.price || p?.basePrice || 0;
                const dateStr = item.purchasedAt
                  ? new Date(item.purchasedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Recent Order";

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Link
                        to={p?.slug ? `/products/${p.slug}` : "#"}
                        className="w-18 h-18 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 group"
                      >
                        <img
                          src={pImg}
                          alt={p?.title || "Product"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>

                      <div className="space-y-1">
                        <Link
                          to={p?.slug ? `/products/${p.slug}` : "#"}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#166534] transition-colors line-clamp-2"
                        >
                          {p?.title || "Purchased Product"}
                        </Link>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          ৳{pPrice.toLocaleString()}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {item.orderNumber && <span>Order #{item.orderNumber}</span>}
                          <span>• {dateStr}</span>
                          {item.shop?.name && <span>• {item.shop.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Eligible for Review
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenWriteReview(p)}
                        className="px-4 py-2 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Write Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECTION B: PUBLISHED REVIEWS TAB                                       */}
      {/* ========================================================================= */}
      {activeMainTab === "reviewed" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filters & Search Toolbar */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: `All (${totalCount})` },
                { id: "5star", label: "5 Stars" },
                { id: "4star", label: "4 Stars" },
                { id: "3star_below", label: "3 Stars & Below" },
                { id: "with_media", label: `With Media (${mediaCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedFilter === tab.id
                      ? "bg-[#166534] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product or review..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Published Reviews Cards */}
          {isLoadingReviews ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading your reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 p-12 sm:p-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
                <Star className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {searchQuery || selectedFilter !== "all"
                    ? "No matching reviews found"
                    : "No Reviews Written Yet"}
                </h3>
                <p className="text-xs text-slate-500">
                  {searchQuery || selectedFilter !== "all"
                    ? "Try clearing your search query or selecting a different rating filter."
                    : "Share your genuine shopping experiences! Delivered orders can be reviewed with star ratings, photos, and video."}
                </p>
              </div>
              {pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveMainTab("to_review")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Review Pending Items ({pendingCount})</span>
                </button>
              ) : (
                <Link
                  to="/user/orders"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Browse My Orders</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => {
                const product = rev.product;
                const prodImg =
                  product?.images?.[0]?.url ||
                  product?.images?.[0] ||
                  "https://placehold.co/200x200?text=Product";
                const prodPrice =
                  product?.discountPrice || product?.price || product?.basePrice || 0;
                const reviewDate = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Recently";

                return (
                  <div
                    key={rev._id}
                    className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Header: Product Snapshot & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5">
                        <Link
                          to={product?.slug ? `/products/${product.slug}` : "#"}
                          className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 group"
                        >
                          <img
                            src={prodImg}
                            alt={product?.title || "Product"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </Link>

                        <div>
                          <Link
                            to={product?.slug ? `/products/${product.slug}` : "#"}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#166534] transition-colors line-clamp-1"
                          >
                            {product?.title || "Purchased Product"}
                          </Link>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {prodPrice > 0 && (
                              <span className="font-bold text-slate-900 dark:text-white">
                                ৳{prodPrice.toLocaleString()}
                              </span>
                            )}
                            {rev.shop?.name && (
                              <span className="flex items-center gap-1 text-slate-400">
                                • <Building className="w-3 h-3" /> {rev.shop.name}
                              </span>
                            )}
                            <span className="text-slate-400">• {reviewDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top-Right Badges & Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rev)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-300 hover:text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewToDelete(rev)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Body: Rating & Comments */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= (rev.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black text-amber-500">
                          {getRatingLabel(rev.rating || 5)}
                        </span>
                      </div>

                      {rev.title && (
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {rev.title}
                        </h4>
                      )}

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Uploaded Media (Photos & Video) */}
                    {((rev.images && rev.images.length > 0) || rev.video?.url) && (
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {/* Photos */}
                        {rev.images?.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewMedia({ type: "image", url: img.url })}
                            className="w-16 h-16 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-2xs group cursor-pointer"
                          >
                            <img
                              src={img.url}
                              alt="Review photo"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          </div>
                        ))}

                        {/* Video */}
                        {rev.video?.url && (
                          <div
                            onClick={() => setPreviewMedia({ type: "video", url: rev.video.url })}
                            className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden relative border border-purple-300 shadow-2xs group cursor-pointer flex items-center justify-center text-white"
                          >
                            <Play className="w-5 h-5 text-purple-400 fill-purple-400 group-hover:scale-115 transition-transform" />
                            <span className="absolute bottom-1 text-[8px] font-bold tracking-wider uppercase text-purple-300">
                              Video
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Merchant / Seller Reply (if any) */}
                    {rev.reply?.comment && (
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                          <Building className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Merchant Response ({rev.shop?.name || "Seller"})</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{rev.reply.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WRITE NEW REVIEW MODAL (Exact Design from Screenshot)                   */}
      {/* ========================================================================= */}
      {newReviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 border-2 border-emerald-300 dark:border-emerald-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Write Verified Buyer Review &amp; Upload Media
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {newReviewProduct.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNewReviewProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{newFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewReview} className="space-y-4">
              {/* Overall Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (newHoverRating || newRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setNewHoverRating(star)}
                          onMouseLeave={() => setNewHoverRating(0)}
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
                    {getRatingLabel(newHoverRating || newRating)}
                  </span>
                </div>
              </div>

              {/* Headline / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Review Headline / Summary
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Premium quality, exceeded my expectations!"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Detailed Review */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Detailed Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What did you like or dislike about this product? How was the packaging, quality, and performance?"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Media Uploads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Photos */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Product Photos ({newPhotos.length}/5)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Max 10MB</span>
                  </div>

                  <input
                    ref={newPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewPhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {newPhotos.map((p, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                      >
                        <img src={p.url} alt="Review upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 cursor-pointer"
                        >
                          <X className="w-2 h-2 stroke-[3]" />
                        </button>
                      </div>
                    ))}

                    {isUploadingNewPhotos && (
                      <div className="w-12 h-12 rounded-xl border border-emerald-300 bg-emerald-50/40 flex items-center justify-center text-emerald-600 shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}

                    {newPhotos.length < 5 && !isUploadingNewPhotos && (
                      <button
                        type="button"
                        onClick={() => newPhotoInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-bold">+ Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Review Video</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Max 100MB</span>
                  </div>

                  <input
                    ref={newVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov"
                    onChange={handleNewVideoUpload}
                    className="hidden"
                  />

                  {newVideo ? (
                    <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/70 bg-purple-50/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Video className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 truncate">
                          {newVideo.name || "Video attached"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewVideo(null)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isUploadingNewVideo ? (
                    <div className="py-2.5 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/30 flex items-center justify-center gap-2 text-purple-600 text-xs font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Video...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => newVideoInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/20 hover:bg-purple-50/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Choose Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewReviewProduct(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || isUploadingNewPhotos || isUploadingNewVideo}
                  className="px-6 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingNew && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Verified Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT REVIEW MODAL                                                      */}
      {/* ========================================================================= */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Your Review
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingReview.product?.title || "Product Review"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Overall Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (editHoverRating || editRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          onMouseEnter={() => setEditHoverRating(star)}
                          onMouseLeave={() => setEditHoverRating(0)}
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
                    {getRatingLabel(editHoverRating || editRating)}
                  </span>
                </div>
              </div>

              {/* Headline / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Review Headline / Summary
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Premium quality, exceeded my expectations!"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Detailed Review */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Detailed Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="What did you like or dislike about this product? How was the packaging, quality, and performance?"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Media Uploads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Photos */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Product Photos ({editPhotos.length}/5)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Max 10MB</span>
                  </div>

                  <input
                    ref={editPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditPhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {editPhotos.map((p, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                      >
                        <img src={p.url} alt="Review upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 cursor-pointer"
                        >
                          <X className="w-2 h-2 stroke-[3]" />
                        </button>
                      </div>
                    ))}

                    {isUploadingEditPhotos && (
                      <div className="w-12 h-12 rounded-xl border border-emerald-300 bg-emerald-50/40 flex items-center justify-center text-emerald-600 shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}

                    {editPhotos.length < 5 && !isUploadingEditPhotos && (
                      <button
                        type="button"
                        onClick={() => editPhotoInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-bold">+ Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Review Video</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Max 100MB</span>
                  </div>

                  <input
                    ref={editVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov"
                    onChange={handleEditVideoUpload}
                    className="hidden"
                  />

                  {editVideo ? (
                    <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/70 bg-purple-50/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Video className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 truncate">
                          {editVideo.name || "Video attached"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditVideo(null)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isUploadingEditVideo ? (
                    <div className="py-2.5 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/30 flex items-center justify-center gap-2 text-purple-600 text-xs font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Video...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => editVideoInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/20 hover:bg-purple-50/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Choose Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || isUploadingEditPhotos || isUploadingEditVideo}
                  className="px-6 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Review?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this review? Your rating and uploaded media will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                Keep Review
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. LIGHTBOX PREVIEW MODAL                                                 */}
      {/* ========================================================================= */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden relative shadow-2xl bg-black"
          >
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {previewMedia.type === "image" ? (
              <img
                src={previewMedia.url}
                alt="Full preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh]"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
