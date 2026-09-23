import React, { useState } from "react";
import {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserBanMutation,
  useDeleteUserMutation,
} from "../../features/admin/adminApi";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/ui/Spinner";

export const AdminUsersPage = () => {
  const { isAdmin } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedVerification, setSelectedVerification] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("user");
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch users with query params
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
    error: queryError,
  } = useGetAdminUsersQuery(
    {
      page,
      limit: 15,
      role: selectedRole !== "all" ? selectedRole : undefined,
      verification: selectedVerification !== "all" ? selectedVerification : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      search: appliedSearch || undefined,
    },
    { skip: !isAdmin }
  );

  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [toggleUserBan, { isLoading: isTogglingBan }] = useToggleUserBanMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const users = response?.data?.users || response?.users || [];
  const totalCount = response?.data?.totalCount || response?.totalCount || users.length;
  const totalPages = response?.data?.totalPages || response?.totalPages || 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const handleToggleBan = async (user) => {
    try {
      const willBan = !user.isBanned;
      await toggleUserBan({
        userId: user._id,
        isBanned: willBan,
      }).unwrap();
      showToast(
        willBan
          ? `Account for ${user.name} has been blocked.`
          : `Account for ${user.name} has been unblocked.`,
        "success"
      );
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser((prev) => ({ ...prev, isBanned: willBan }));
      }
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to update account status", "error");
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      await updateUserRole({
        userId: selectedUser._id,
        role: newRole,
      }).unwrap();
      showToast(`User role updated to ${newRole.toUpperCase()}!`, "success");
      setSelectedUser((prev) => ({ ...prev, role: newRole }));
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to update role", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete._id).unwrap();
      showToast(`User ${userToDelete.name} deleted successfully!`, "success");
      setUserToDelete(null);
      if (selectedUser && selectedUser._id === userToDelete._id) {
        setSelectedUser(null);
      }
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to delete user account", "error");
    }
  };

  const handleOpenView = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
  };

  const getRoleBadge = (role = "user") => {
    const r = role.toLowerCase();
    if (r === "admin") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
          ADMIN
        </span>
      );
    }
    if (r === "seller") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">
          SELLER
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
        USER
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Floating Toast Alert */}
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              User Management
            </h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View, search, filter verification status, block, and manage registered platform accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-purple-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
            Total Users: <span className="text-purple-600 font-bold">{totalCount}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5"
      >
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users by name, email, phone..."
            className="w-full pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setAppliedSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Dropdown */}
        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setPage(1);
          }}
          className="lg:col-span-2 w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
        >
          <option value="all">All Roles</option>
          <option value="user">User / Buyer</option>
          <option value="seller">Seller / Merchant</option>
          <option value="admin">Administrator</option>
        </select>

        {/* Verification Dropdown */}
        <select
          value={selectedVerification}
          onChange={(e) => {
            setSelectedVerification(e.target.value);
            setPage(1);
          }}
          className="lg:col-span-2 w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
        >
          <option value="all">All Verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>

        {/* Account Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="lg:col-span-2 w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
        >
          <option value="all">All Account Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>

        {/* Search Submit Button */}
        <button
          type="submit"
          className="sm:col-span-2 lg:col-span-2 w-full py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Spinner size="md" text="Loading User Directory..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              👥
            </div>
            <h3 className="text-sm font-bold text-slate-800">No users found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {appliedSearch
                ? `No user accounts match "${appliedSearch}". Try adjusting your filters.`
                : "No registered accounts found matching your selected filters."}
            </p>
            {appliedSearch && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                  setSelectedRole("all");
                  setSelectedVerification("all");
                  setSelectedStatus("all");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs text-left text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">User</th>
                  <th className="px-4 sm:px-6 py-3.5">Contact</th>
                  <th className="px-4 sm:px-6 py-3.5">Role</th>
                  <th className="px-4 sm:px-6 py-3.5">Email Status</th>
                  <th className="px-4 sm:px-6 py-3.5">Account Status</th>
                  <th className="px-4 sm:px-6 py-3.5">Joined Date</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const shortId = `#${(u._id || "").slice(-6).toUpperCase()}`;
                  const initial = u.name ? u.name[0].toUpperCase() : "U";
                  const isVerified = Boolean(u.isVerified);
                  const isBanned = Boolean(u.isBanned);
                  const dateStr = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "8/28/2026";

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User Avatar + Name + ID */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {u.name || "Unnamed User"}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              ID: {shortId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="font-medium text-slate-800">{u.email}</div>
                        <div className="text-[11px] text-slate-400">
                          {u.phone || "No phone linked"}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 sm:px-6 py-4">{getRoleBadge(u.role)}</td>

                      {/* Email Verification */}
                      <td className="px-4 sm:px-6 py-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                            ⊘ Unverified
                          </span>
                        )}
                      </td>

                      {/* Account Block Status */}
                      <td className="px-4 sm:px-6 py-4">
                        {isBanned ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 sm:px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {dateStr}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          {/* View User Modal */}
                          <button
                            onClick={() => handleOpenView(u)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="View user details & roles"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Quick Ban / Unban Toggle */}
                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={isTogglingBan}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBanned
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-500 hover:bg-amber-50"
                            }`}
                            title={isBanned ? "Unblock account" : "Suspend / Block account"}
                          >
                            {isBanned ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete user record"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-700">{page}</span> of{" "}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details & Role Elevation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500">Platform User Account Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Full Name</span>
                  <div className="font-bold text-slate-900 mt-0.5 break-words">{selectedUser.name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">User ID</span>
                  <div className="font-mono text-slate-800 mt-0.5 break-all text-[11px]">{selectedUser._id}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Email Address</span>
                  <div className="font-medium text-slate-900 mt-0.5 break-all">{selectedUser.email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Phone Number</span>
                  <div className="text-slate-800 mt-0.5">{selectedUser.phone || "Not provided"}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Email Verification</span>
                  <div className="mt-0.5">
                    {selectedUser.isVerified ? (
                      <span className="text-emerald-700 font-semibold">✓ Verified</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">⊘ Unverified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Account Status</span>
                  <div className="mt-0.5">
                    {selectedUser.isBanned ? (
                      <span className="text-rose-700 font-bold">Blocked / Suspended</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Elevation Form */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
                <span className="text-[11px] font-bold uppercase text-purple-800 tracking-wider block">
                  RBAC Role Elevation
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-purple-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="user">User / Buyer</option>
                    <option value="seller">Seller / Merchant</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <button
                    type="button"
                    disabled={isUpdatingRole || newRole === selectedUser.role}
                    onClick={handleSaveRole}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer text-center"
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleBan(selectedUser)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  selectedUser.isBanned
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                {selectedUser.isBanned ? "Unblock Account" : "Block Account"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{userToDelete.name}</strong> ({userToDelete.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
