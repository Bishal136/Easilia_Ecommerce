import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetShopBySlugQuery } from "../../features/shops/shopApi";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetOrCreateChatMutation } from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/ui/Spinner";
import { Store, MessageCircle, Star, Package, CheckCircle2 } from "lucide-react";

export const ShopPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data: shopRes, isLoading: shopLoading } = useGetShopBySlugQuery(slug, {
    skip: !slug,
  });
  const shop = shopRes?.data?.shop || shopRes?.shop;

  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery(
    shop?._id ? { shop: shop._id } : undefined,
    { skip: !shop?._id }
  );
  const products = productsRes?.data?.products || productsRes?.products || [];

  const [getOrCreateChat, { isLoading: isStartingChat }] = useGetOrCreateChatMutation();

  const handleChatWithStore = async () => {
    if (!isAuthenticated && !user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (user?._id && shop?.owner && user._id.toString() === (shop.owner._id || shop.owner).toString()) {
      alert("You are the owner of this store.");
      return;
    }

    try {
      const res = await getOrCreateChat({
        shopId: shop?._id,
      }).unwrap();

      const chatId = res?.data?.chat?._id || res?.chat?._id;
      if (chatId) {
        navigate(`/user/messages?chatId=${chatId}`);
      }
    } catch (err) {
      console.error("Failed to connect with store:", err);
      alert(err?.data?.message || "Failed to start chat with store.");
    }
  };

  if (shopLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" text="Loading Storefront..." />
      </div>
    );
  }

  const shopName = shop?.name || (slug ? slug.replace(/-/g, " ") : "Merchant Store");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Shop Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 z-10">
          <div className="w-24 h-24 rounded-3xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl overflow-hidden shrink-0">
            {shop?.logo?.url ? (
              <img src={shop.logo.url} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <span>🏪</span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black capitalize tracking-tight">
                {shopName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Merchant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {shop?.description || "Welcome to our official flagship storefront. High quality products and fast dispatch."}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span>📍 {shop?.address?.city || "Dhaka, Bangladesh"}</span>
              <span>⭐ 4.9 (98% Positive)</span>
              <span>📦 {products.length} Products</span>
            </div>
          </div>
        </div>

        {/* Chat with Store Action */}
        <button
          type="button"
          onClick={handleChatWithStore}
          disabled={isStartingChat}
          className="z-10 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isStartingChat ? "Connecting..." : "Live Chat with Store"}</span>
        </button>
      </div>

      {/* Shop Products Inventory */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Store Catalog & Products</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {products.length} item{products.length === 1 ? "" : "s"}
          </span>
        </div>

        {productsLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-slate-400">
            <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No products published yet
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This merchant is updating their inventory. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const thumbnail =
                p.images?.find((img) => img.isThumbnail)?.url ||
                p.images?.[0]?.url ||
                "";
              const price = p.discountPrice || p.basePrice;

              return (
                <div
                  key={p._id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3 overflow-hidden flex items-center justify-center">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                      {p.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-[#166534] dark:text-emerald-400">
                        ৳{price?.toLocaleString()}
                      </p>
                      {p.discountPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ৳{p.basePrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/products/${p.slug}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#166534] hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
