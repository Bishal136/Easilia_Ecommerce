import React, { useState, useMemo } from "react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../features/categories/categoryApi";
import Spinner from "../../components/ui/Spinner";
import CategoryImageUpload from "../../components/ui/CategoryImageUpload";

export const AdminCategoriesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    parent: "",
    image: { url: "", path: "" },
    description: "",
    order: 0,
    isActive: true,
  });

  // Fetch flat categories list for table & dropdowns
  const { data: flatResponse, isLoading, isFetching, refetch } = useGetCategoriesQuery({
    flat: true,
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const rawCategories = flatResponse?.data?.categories || flatResponse?.categories || [];

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchInput.trim()) return rawCategories;
    const q = searchInput.toLowerCase().trim();
    return rawCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [rawCategories, searchInput]);

  // Root categories for parent selection
  const rootCategories = useMemo(() => {
    return rawCategories.filter((c) => !c.parent);
  }, [rawCategories]);

  const handleOpenCreateModal = (parentCategory = null) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      parent: parentCategory ? parentCategory._id : "",
      image: { url: "", path: "" },
      description: "",
      order: rawCategories.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      parent: category.parent?._id || category.parent || "",
      image: category.image || { url: "", path: "" },
      description: category.description || "",
      order: category.order ?? 0,
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        parent: formData.parent || null,
        image: formData.image?.url ? formData.image : undefined,
        description: formData.description?.trim() || undefined,
        order: Number(formData.order) || 0,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...payload,
        }).unwrap();
        showToast(`Category "${payload.name}" updated successfully!`, "success");
      } else {
        await createCategory(payload).unwrap();
        showToast(`Category "${payload.name}" created successfully!`, "success");
      }

      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to save category", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete._id).unwrap();
      showToast(`Category "${categoryToDelete.name}" removed successfully!`, "success");
      setCategoryToDelete(null);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to delete category", "error");
    }
  };

  // Find parent category name
  const getParentName = (parentId) => {
    if (!parentId) return "Root Category";
    const found = rawCategories.find((c) => c._id === (parentId._id || parentId));
    return found ? found.name : "Subcategory";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all transform animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, organize category hierarchies, and manage product catalog taxonomy.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="w-full sm:w-auto px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Search and Total Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium shrink-0">
          Total: <span className="font-bold text-slate-700">{filteredCategories.length}</span> categories
        </div>
      </div>

      {/* Categories Content Card */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex justify-center items-center">
          <Spinner size="md" text="Loading Categories Taxonomy..." />
        </div>
      ) : filteredCategories.length === 0 ? (
        /* Empty State matching Figma */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 text-center text-slate-400 text-xs font-medium">
          No categories found.
        </div>
      ) : (
        /* Populated Table Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-xs text-left text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Image</th>
                  <th className="px-4 sm:px-6 py-3.5">Category Name</th>
                  <th className="px-4 sm:px-6 py-3.5">Slug</th>
                  <th className="px-4 sm:px-6 py-3.5">Hierarchy</th>
                  <th className="px-4 sm:px-6 py-3.5">Order</th>
                  <th className="px-4 sm:px-6 py-3.5">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const isSub = Boolean(cat.parent);
                  const parentTitle = getParentName(cat.parent);
                  const imageUrl = cat.image?.url || (typeof cat.image === "string" ? cat.image : "");

                  return (
                    <tr key={cat._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="px-6 py-3.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-xs">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-base">📁</span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                          <span>{cat.name}</span>
                          {isSub && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded font-normal">
                              Sub
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                            {cat.description}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          /{cat.slug}
                        </span>
                      </td>

                      {/* Hierarchy */}
                      <td className="px-6 py-3.5">
                        {isSub ? (
                          <span className="text-[11px] text-purple-700 font-medium">
                            {parentTitle} → {cat.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Root Category
                          </span>
                        )}
                      </td>

                      {/* Display Order */}
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {cat.order ?? 0}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        {cat.isActive !== false ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {!isSub && (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateModal(cat)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-purple-600 border border-purple-200 rounded-md text-xs font-semibold transition-colors"
                            title="Add subcategory"
                          >
                            + Sub
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors inline-flex items-center justify-center align-middle"
                          title="Delete category"
                        >
                          <svg className="w-4 h-4 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCategory
                    ? `Updating category "${editingCategory.name}"`
                    : "Add a category or subcategory to catalog taxonomy"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                {/* Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Key Board, Computer, Men's Fashion..."
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Parent Hierarchy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Parent Hierarchy
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">None (Root Level Category)</option>
                    {rootCategories
                      .filter((c) => !editingCategory || c._id !== editingCategory._id)
                      .map((rc) => (
                        <option key={rc._id} value={rc._id}>
                          {rc.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category Image & Display Order in 2 Clean Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <CategoryImageUpload
                    value={formData.image}
                    onChange={(image) => setFormData({ ...formData, image })}
                    label="Category Image"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      Display Order Sequence
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description for SEO and catalog organization..."
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Status Active Toggle */}
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active in Storefront Navigation & Catalog
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
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
                  className="w-full sm:w-auto px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                >
                  {isCreating || isUpdating
                    ? "Saving..."
                    : editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Category</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{categoryToDelete.name}</strong>? Any nested subcategories will also be deleted.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
