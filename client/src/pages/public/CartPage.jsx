import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Check,
  CreditCard,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  updateQuantity,
  removeFromCart,
  clearCart,
  setDirectBuyItem,
} from "../../features/cart/cartSlice";

export const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.items || []);

  // Multi-item selection state (default all selected)
  const [selectedItemIds, setSelectedItemIds] = useState(() =>
    cartItems.map((it) => it.product?._id || it.product?.id || it.product)
  );

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  // Toggle single item selection
  const handleToggleSelect = (productId) => {
    setSelectedItemIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all or deselect all
  const allSelected =
    cartItems.length > 0 && selectedItemIds.length === cartItems.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(
        cartItems.map((it) => it.product?._id || it.product?.id || it.product)
      );
    }
  };

  // Selected items calculation
  const selectedItems = useMemo(() => {
    return cartItems.filter((it) =>
      selectedItemIds.includes(it.product?._id || it.product?.id || it.product)
    );
  }, [cartItems, selectedItemIds]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = Number(
        item.variant?.discountPrice ||
          item.variant?.price ||
          item.product?.discountPrice ||
          item.product?.basePrice ||
          item.product?.price ||
          0
      );
      return acc + price * (item.quantity || 1);
    }, 0);
  }, [selectedItems]);

  const shippingCost = 0; // Free shipping
  const total = Math.max(0, subtotal - appliedDiscount + shippingCost);

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === "WELCOME10" || code === "SAVE10") {
      const disc = Math.round(subtotal * 0.1);
      setAppliedDiscount(disc);
      setCouponMessage("10% Discount Applied!");
    } else if (code === "EASILIA100" || code === "DEAL100") {
      setAppliedDiscount(100);
      setCouponMessage("৳100 Discount Applied!");
    } else {
      setCouponMessage("Invalid coupon code");
    }
  };

  // Direct Buy Single Item
  const handleBuySingleItem = (item) => {
    dispatch(
      setDirectBuyItem({
        product: item.product,
        quantity: item.quantity || 1,
        variant: item.variant || null,
      })
    );
    navigate("/checkout?direct=true");
  };

  // Proceed to Checkout with all selected items
  const handleCheckoutSelected = () => {
    if (selectedItems.length === 0) return;
    navigate("/checkout");
  };

  // Zero-State: Empty Cart
  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-24 text-center space-y-6 font-sans">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10 stroke-1 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Your Shopping Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet. Discover trending deals and products from top sellers.
          </p>
        </div>
        <div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <span>Explore Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* ========================================================================= */}
      {/* 0. Top Step Navigation / Progress Bar                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-semibold pb-4">
        {/* Step 1: Active Shopping Cart */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1b4332] text-white shadow-xs font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Shopping Cart</span>
        </div>

        <span className="w-8 sm:w-12 h-px bg-slate-200 dark:bg-slate-800"></span>

        {/* Step 2: Checkout */}
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span>Checkout</span>
        </div>

        <span className="w-8 sm:w-12 h-px bg-slate-200 dark:bg-slate-800"></span>

        {/* Step 3: Order Complete */}
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <Check className="w-4 h-4 text-slate-400" />
          <span>Order Complete</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Main Grid (Left 8 cols: Cart Items | Right 4 cols: Order Summary)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Your Cart + Value Guarantees */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Cart Items Card */}
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header: Select All + Count + Clear All */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 font-black text-slate-900 dark:text-white cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      allSelected
                        ? "bg-[#1b4332] border-[#1b4332] text-white"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span>
                    Select All ({selectedItemIds.length}/{cartItems.length})
                  </span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  Your Cart{" "}
                  <span className="text-slate-400 font-normal">
                    ({cartItems.length})
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => dispatch(clearCart())}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const productId =
                  item.product?._id || item.product?.id || item.product;
                const isSelected = selectedItemIds.includes(productId);
                const imgUrl =
                  item.product?.images?.[0]?.url ||
                  item.product?.images?.[0] ||
                  "https://placehold.co/150x150?text=Item";
                const sellerName =
                  item.product?.shop?.name || "Bishal Biswas's Shop";

                const unitPrice = Number(
                  item.variant?.discountPrice ||
                    item.variant?.price ||
                    item.product?.discountPrice ||
                    item.product?.basePrice ||
                    item.product?.price ||
                    0
                );
                const lineTotal = unitPrice * (item.quantity || 1);

                return (
                  <div
                    key={productId}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    {/* Left: Checkbox + Thumbnail + Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(productId)}
                        className="cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-[#1b4332] border-[#1b4332] text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>

                      {/* Product Thumbnail with green border ring */}
                      <Link
                        to={`/products/${item.product?.slug || productId}`}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/80 overflow-hidden shrink-0 group"
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Product Title & Seller */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <Link
                          to={`/products/${item.product?.slug || productId}`}
                          className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 hover:text-[#166534]"
                        >
                          {item.product?.title || "Product"}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          Sold by:{" "}
                          <span className="text-[#166534] dark:text-emerald-400 font-bold">
                            {sellerName}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Quantity Adjusters + Price + Buy Item + Delete */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4 pt-2 sm:pt-0 shrink-0">
                      {/* Quantity Selector Pill */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId,
                                quantity: Math.max(1, (item.quantity || 1) - 1),
                              })
                            )
                          }
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white min-w-[24px] text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId,
                                quantity: (item.quantity || 1) + 1,
                              })
                            )
                          }
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Unit Price */}
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                        ৳{unitPrice.toFixed(2)}
                      </span>

                      {/* Line Total */}
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white min-w-[70px] text-right font-mono">
                        ৳{lineTotal.toFixed(2)}
                      </span>

                      {/* Buy Item Direct Button */}
                      <button
                        type="button"
                        onClick={() => handleBuySingleItem(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1a382b] hover:bg-[#12261d] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        Buy Item
                      </button>

                      {/* Delete Trash Icon */}
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(productId))}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Order Summary Sidebar */}

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            {/* Header: Title + Selected badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Order Summary
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                {selectedItemIds.length} of {cartItems.length} Selected
              </span>
            </div>

            {/* Price Line Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ৳{appliedDiscount.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Costs</span>
                <span className="font-black text-emerald-600">FREE</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-2 pt-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Apply Coupon
                </button>
              </form>
              {couponMessage && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="space-y-2 pt-1">
              <div className="w-full bg-emerald-500 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full w-full rounded-full"></div>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <span>🎉</span>
                <span>You unlocked FREE Shipping on this order!</span>
              </p>
            </div>

            {/* Continue Shopping Link */}
            <div className="text-center pt-2">
              <Link
                to="/products"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-700 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Primary Checkout CTA Button */}
            <div>
              <button
                type="button"
                onClick={handleCheckoutSelected}
                disabled={selectedItems.length === 0}
                className="w-full py-3.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Checkout All Items</span>
                <span>|</span>
                <span>৳{total.toFixed(2)}</span>
              </button>
            </div>

            {/* Supported Payment Gateways Strip */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                SUPPORTED PAYMENT GATEWAYS & METHODS
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PortPos
                </span>
                <span className="px-2.5 py-1 rounded-md bg-pink-50 text-pink-700 border border-pink-200">
                  bKash
                </span>
                <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                  Nagad
                </span>
                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Rocket
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Cards
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  COD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
