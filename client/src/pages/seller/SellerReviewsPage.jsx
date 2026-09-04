import React, { useState } from "react";
import {
  useGetSellerReviewsQuery,
  useReplyReviewMutation,
  useDeleteReviewMutation,
} from "../../features/reviews/reviewApi";
import Spinner from "../../components/ui/Spinner";

export const SellerReviewsPage = () => {
  const [ratingFilter, setRatingFilter] = useState("");
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");

  const { data: reviewsRes, isLoading } = useGetSellerReviewsQuery(
    ratingFilter ? { rating: ratingFilter, limit: 50 } : { limit: 50 }
  );
  const reviews = reviewsRes?.data?.reviews || reviewsRes?.reviews || [];
  const totalCount = reviewsRes?.data?.totalCount ?? reviewsRes?.totalCount ?? reviews.length;

  const [postReply, { isLoading: isReplying }] = useReplyReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const handleOpenReplyModal = (review) => {
    setActiveReview(review);
    setReplyText(review.reply?.comment || "");
    setReplyError("");
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyError("");

    try {
      await postReply({ reviewId: activeReview._id, reply: replyText.trim() }).unwrap();
      setReplyModalOpen(false);
      setActiveReview(null);
      setReplyText("");
    } catch (err) {
      setReplyError(err?.data?.message || "Failed to post reply.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(reviewId).unwrap();
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#131B2E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          Customer Reviews & Merchant Reputation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor verified buyer feedback, address customer inquiries, and publish official store replies
        </p>
      </div>

      {/* Ratings Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-[#131B2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          type="button"
          onClick={() => setRatingFilter("")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            !ratingFilter
              ? "bg-fuchsia-600 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
          }`}
        >
          All Reviews ({totalCount})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => setRatingFilter(stars.toString())}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              ratingFilter === stars.toString()
                ? "bg-fuchsia-600 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            }`}
          >
            <span>{stars}</span>
            <span className="text-amber-400">★</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" text="Loading Customer Feedback..." />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <span className="text-4xl">⭐</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No reviews found</h3>
            <p className="text-xs text-slate-500">
              Customer reviews for your store's products will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {rev.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {rev.user?.name || "Verified Customer"}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reviewed product: <strong className="text-slate-800 dark:text-slate-200">{rev.product?.title || "Product"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400 text-sm">
                      {"★".repeat(rev.rating || 5)}
                      {"☆".repeat(5 - (rev.rating || 5))}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-11">
                  "{rev.comment}"
                </p>

                {/* Official Merchant Reply Block if Present */}
                {rev.reply?.comment ? (
                  <div className="ml-11 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border-l-2 border-fuchsia-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        Official Store Response
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {rev.reply.createdAt ? new Date(rev.reply.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {rev.reply.comment}
                    </p>
                  </div>
                ) : null}

                {/* Reply Action Trigger */}
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer"
                  >
                    {rev.reply?.comment ? "Edit Official Reply" : "+ Post Merchant Reply"}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteReview(rev._id)}
                    className="text-xs font-medium text-rose-500 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Official Merchant Reply Modal */}
      {replyModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131B2E] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Merchant Reply
              </h3>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {activeReview.user?.name} wrote:
              </p>
              <p className="text-slate-600 dark:text-slate-400 italic">
                "{activeReview.comment}"
              </p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              {replyError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs">
                  {replyError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Public Store Reply
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for your feedback! We are thrilled to know you love the product..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplying}
                  className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isReplying ? "Publishing..." : "Publish Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReviewsPage;
