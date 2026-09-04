import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetOwnShopQuery } from "../../features/shops/shopApi";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../../features/products/productApi";
import { useGetCategoriesQuery } from "../../features/categories/categoryApi";
import Spinner from "../../components/ui/Spinner";
import ProductFormModal from "../../components/seller/ProductFormModal";

export const SellerProductsPage = () => {
  const { data: shopRes } = useGetOwnShopQuery();
  const shop = shopRes?.data?.shop || shopRes?.shop;

  const { data: categoriesRes } = useGetCategoriesQuery();
  const categories = categoriesRes?.data?.categories || categoriesRes?.categories || [];

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [unverifiedModalOpen, setUnverifiedModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // KYC Verification Status
  const isVerified = shop?.kycStatus === "approved" && shop?.status === "active";
  const isKycPending = !shop || shop?.kycStatus === "pending" || shop?.status === "pending";
  const isKycRejected = shop?.kycStatus === "rejected" || shop?.status === "rejected";

  // Product Queries & Mutations
  const { data: productsRes, isLoading } = useGetProductsQuery(
    shop?._id ? { shop: shop._id, limit: 100 } : { limit: 100 },
    { skip: !shop?._id }
  );
  const products = productsRes?.data?.products || productsRes?.products || [];

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      !selectedCategory ||
      p.category?._id === selectedCategory ||
      p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAddModal = () => {
    if (!isVerified) {
      setUnverifiedModalOpen(true);
      return;
    }
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    if (!isVerified) {
      setUnverifiedModalOpen(true);
      return;
    }
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleProductSubmit = async (payload) => {
    if (!isVerified) {
      setUnverifiedModalOpen(true);
      return;
    }
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      setModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Failed to save product:", err);
      alert(err?.data?.message || err?.message || "Failed to save product.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete._id).unwrap();
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. KYC NOT VERIFIED WARNING BANNER */}
      {!isVerified && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-in fade-in duration-200 ${
            isKycRejected
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                isKycRejected
                  ? "bg-rose-100 dark:bg-rose-900 text-rose-700"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700"
              }`}
            >
              {isKycRejected ? "🚫" : "⚠️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm">
                  {isKycRejected
                    ? "KYC Verification Rejected – Action Required"
                    : "You are not verified yet (KYC Status: PENDING)"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isKycRejected
                      ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                      : "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                >
                  {shop?.kycStatus || "PENDING"}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isKycRejected
                  ? `Your store application was rejected: "${shop?.rejectionReason || "Incomplete documentation"}". Please update your documents in Shop Profile.`
                  : "Your seller account is currently under review by our administration team. You cannot create, publish, or sell products until your KYC is verified and approved."}
              </p>
            </div>
          </div>

          <Link
            to="/seller/profile"
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto transition-colors shadow-xs ${
              isKycRejected
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            Check KYC Status →
          </Link>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#131B2E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            Product Inventory & Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, manage pricing, update stock levels, configure variants, and manage media
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
            isVerified
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
        >
          <span>{isVerified ? "+" : "🔒"}</span>
          <span>Add New Product</span>
        </button>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#131B2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by title, keywords, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Product List Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" text="Loading Inventory..." />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">📦</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedCategory
                ? "Try adjusting your search criteria or category filter."
                : isVerified
                ? "You haven't added any products to your catalog yet. Click '+ Add New Product' to get started."
                : "Your KYC verification is currently pending. Once verified by Admin, you can publish products here."}
            </p>
            {!search && !selectedCategory && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className={`mt-2 px-4 py-2 rounded-xl font-semibold text-xs shadow-xs cursor-pointer ${
                  isVerified
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {isVerified ? "Create First Product" : "Check Verification Status"}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          {prod.images?.[0]?.url ? (
                            <img
                              src={prod.images[0].url}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base">📦</span>
                          )}
                        </div>
                        <div className="max-w-[200px] truncate">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {prod.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {prod.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {prod.category?.name || "General"}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      ${Number(prod.basePrice || prod.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-semibold ${
                          prod.totalStock <= 5
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {prod.totalStock} units
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {prod.variants?.length > 0
                        ? `${prod.variants.length} options`
                        : "None"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {prod.isActive ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prod)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductToDelete(prod);
                          setDeleteModalOpen(true);
                        }}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. UNVERIFIED SELLER MODAL */}
      {unverifiedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2E] max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                You Are Not Verified Yet!
              </h3>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 uppercase">
                KYC Status: {shop?.kycStatus || "PENDING"}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your seller KYC documents are currently <strong>PENDING</strong> administrator review and approval. You cannot create, publish, or edit products until your shop is officially verified.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>• Review times typically take 24–48 hours.</p>
              <p>• Make sure your Trade License, NID, and Tax IDs are uploaded.</p>
              <p>• Once approved, product publishing unlocks automatically.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setUnverifiedModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
              <Link
                to="/seller/profile"
                onClick={() => setUnverifiedModalOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors text-center shadow-xs"
              >
                Go to Shop Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 6. Product Creation & Edit Modal */}
      {modalOpen && (
        <ProductFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={handleProductSubmit}
          initialData={editingProduct}
          categories={categories}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2E] max-w-sm w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Product
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 dark:text-slate-200">
                "{productToDelete?.title}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
