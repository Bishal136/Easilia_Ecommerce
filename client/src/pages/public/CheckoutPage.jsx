import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Tag,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Info,
  X,
  Trash2,
} from "lucide-react";
import { useCreateOrderMutation } from "../../features/orders/orderApi";
import { useGetProfileQuery } from "../../features/user/userApi";
import { useApplyCouponMutation } from "../../features/coupons/couponApi";
import {
  clearCart,
  removeFromCart,
  clearDirectBuyItem,
} from "../../features/cart/cartSlice";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const isDirect = searchParams.get("direct") === "true";

  // Redux Cart State
  const cartItems = useSelector((state) => state.cart?.items || []);
  const directBuyItem = useSelector((state) => state.cart?.directBuyItem);
  const token = localStorage.getItem("easilia_token");

  // Filter items: If Direct Buy, checkout ONLY that single product!
  const checkoutItems = useMemo(() => {
    if (isDirect && directBuyItem) {
      return [directBuyItem];
    }
    return cartItems;
  }, [isDirect, directBuyItem, cartItems]);

  // User Profile with saved addresses
  const { data: userProfile } = useGetProfileQuery(undefined, {
    skip: !token,
  });
  const savedAddresses = userProfile?.addresses || [];

  // API Mutations
  const [createOrderMutation, { isLoading: isPlacingOrder }] = useCreateOrderMutation();

  // Form State
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [stateRegion, setStateRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Shipping Method & Payment Selection
  const [shippingSpeed, setShippingSpeed] = useState("standard"); // "standard" | "express"
  const [paymentMethod, setPaymentMethod] = useState("portpos"); // "portpos" | "cod"

  // Coupon State & Mutation
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [applyCouponApi, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  // Populate default user info
  useEffect(() => {
    if (userProfile) {
      if (!fullName) setFullName(userProfile.name || "");
      if (!phone) setPhone(userProfile.phone || "");

      if (savedAddresses.length > 0) {
        const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id || defaultAddr.id);
          setFullName(defaultAddr.fullName || userProfile.name || "");
          setPhone(defaultAddr.phone || userProfile.phone || "");
          setStreet(defaultAddr.street || defaultAddr.address || "");
          setCity(defaultAddr.city || "Dhaka");
          setStateRegion(defaultAddr.state || "");
          setZipCode(defaultAddr.zipCode || defaultAddr.postalCode || "");
        }
      }
    }
  }, [userProfile]);

  // Handle saved address switch
  const handleSelectSavedAddress = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      setStreet("");
      setZipCode("");
      setStateRegion("");
      return;
    }
    const found = savedAddresses.find((a) => (a._id || a.id) === addrId);
    if (found) {
      setFullName(found.fullName || userProfile?.name || fullName);
      setPhone(found.phone || userProfile?.phone || phone);
      setStreet(found.street || found.address || "");
      setCity(found.city || "Dhaka");
      setStateRegion(found.state || "");
      setZipCode(found.zipCode || found.postalCode || "");
    }
  };

  // Remove Item from Checkout
  const handleRemoveItem = (productId) => {
    if (isDirect) {
      dispatch(clearDirectBuyItem());
      navigate("/products");
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
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
  }, [checkoutItems]);

  const isOutsideDhaka = city.trim().toLowerCase() !== "dhaka";
  const baseShippingCost = isOutsideDhaka ? 120 : 60;
  const shippingCost = shippingSpeed === "express" ? baseShippingCost + 90 : baseShippingCost;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percentage") {
      let disc = (subtotal * (appliedCoupon.discountValue || 0)) / 100;
      if (appliedCoupon.maxDiscountAmount && disc > appliedCoupon.maxDiscountAmount) {
        disc = appliedCoupon.maxDiscountAmount;
      }
      return Math.round(disc * 100) / 100;
    }
    if (appliedCoupon.discountType === "free_shipping") {
      return Math.min(shippingCost, 60);
    }
    if (appliedCoupon.discountType === "fixed") {
      return Math.min(subtotal, appliedCoupon.discountValue || appliedCoupon.discountAmount || 0);
    }
    return appliedCoupon.discountAmount || 0;
  }, [appliedCoupon, subtotal, shippingCost]);

  const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  // Apply Coupon via Live API
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const res = await applyCouponApi({ code, orderAmount: subtotal }).unwrap();
      const couponData = res?.data || res;
      setAppliedCoupon({
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discountAmount: couponData.discountAmount,
        minOrderAmount: couponData.minOrderAmount,
        maxDiscountAmount: couponData.maxDiscountAmount,
      });
      setCouponInput("");
      setCouponError("");
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.data?.errorDetails?.[0]?.message ||
        err?.error ||
        "Invalid or expired coupon code";
      setCouponError(msg);
      setAppliedCoupon(null);
    }
  };

  // Submit Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (checkoutItems.length === 0) {
      setErrorMessage("Your checkout is empty. Please add products to proceed.");
      return;
    }

    // Determine current selected saved address details if applicable
    const selectedAddr =
      selectedAddressId !== "new"
        ? savedAddresses.find((a) => (a._id || a.id) === selectedAddressId)
        : null;

    const finalFullName =
      fullName || selectedAddr?.fullName || userProfile?.name || "Valued Customer";
    const finalPhone =
      phone || selectedAddr?.phone || userProfile?.phone || "01700000000";
    const finalStreet =
      street ||
      selectedAddr?.street ||
      selectedAddr?.address ||
      selectedAddr?.line1 ||
      "Standard Delivery Address";
    const finalCity = city || selectedAddr?.city || "Dhaka";
    const finalState = stateRegion || selectedAddr?.state || "";
    const finalZipCode = zipCode || selectedAddr?.zipCode || selectedAddr?.postalCode || "";

    if (!finalFullName || !finalPhone || !finalStreet || !finalCity) {
      setErrorMessage("Please complete all required shipping address fields.");
      return;
    }

    // Format items for backend
    const orderItems = checkoutItems.map((it) => {
      const productId = it.product?._id || it.product?.id || it.product;
      const unitPrice = Number(
        it.variant?.discountPrice ||
          it.variant?.price ||
          it.product?.discountPrice ||
          it.product?.basePrice ||
          it.product?.price ||
          0
      );

      return {
        product: productId,
        quantity: it.quantity || 1,
        variant: it.variant?.name
          ? {
              name: it.variant.name,
              sku: it.variant.sku || "",
              price: unitPrice,
            }
          : undefined,
      };
    });

    const payload = {
      items: orderItems,
      shippingAddress: {
        fullName: finalFullName,
        phone: finalPhone,
        street: finalStreet,
        city: finalCity,
        state: finalState || undefined,
        zipCode: finalZipCode || undefined,
        country: "Bangladesh",
      },
      paymentMethod,
      couponCode: appliedCoupon?.code || undefined,
      notes: deliveryNotes || undefined,
    };

    try {
      const res = await createOrderMutation(payload).unwrap();
      const order = res?.data?.order || res?.order;
      const orderId = order?._id || order?.orderNumber || "ORD-" + Math.floor(100000 + Math.random() * 900000);

      // Clear Cart or direct buy on successful placement
      if (isDirect) {
        dispatch(clearDirectBuyItem());
      } else {
        dispatch(clearCart());
      }

      if (paymentMethod === "portpos") {
        navigate(`/payment/success?orderId=${orderId}&method=portpos`);
      } else {
        navigate(`/payment/success?orderId=${orderId}&method=cod`);
      }
    } catch (err) {
      const msg = err?.data?.message || err?.error || "Failed to place order. Please verify your details.";
      setErrorMessage(msg);
    }
  };

  // Zero-State: Empty Cart
  if (checkoutItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10 stroke-1 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Checkout is Empty</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            You don't have any items selected for checkout. Browse our catalog to find what you love.
          </p>
        </div>
        <div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
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
      {/* 0. Top Breadcrumb & Step Progress Bar                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Link
            to={isDirect ? "/products" : "/cart"}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Secure Checkout
              </h1>
              {isDirect && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider">
                  Direct Buy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Complete your order with verified buyer protection</p>
          </div>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">
              ✓
            </span>
            <span>Cart</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">──</span>
          <div className="flex items-center gap-1.5 text-[#166534] dark:text-emerald-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center text-[11px] font-black">
              2
            </span>
            <span>Shipping & Payment</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">──</span>
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Main Checkout Grid (Left: Forms | Right: Order Summary)                */}
      {/* ========================================================================= */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Address, Shipping, Payment */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 1. Shipping & Contact Information */}
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#166534] dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Delivery Address
                  </h2>
                  <p className="text-[11px] text-slate-400">Where should we deliver your packages?</p>
                </div>
              </div>

              {savedAddresses.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
                  {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
                </span>
              )}
            </div>

            {/* Saved Address Quick Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Delivery Address
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = (addr._id || addr.id) === selectedAddressId;
                    return (
                      <div
                        key={addr._id || addr.id}
                        onClick={() => handleSelectSavedAddress(addr._id || addr.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? "border-[#166534] bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900 dark:text-white">
                            {addr.label || addr.fullName || "Primary Address"}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          {addr.street || addr.line1 || addr.address}
                          {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{addr.phone}</p>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => handleSelectSavedAddress("new")}
                    className={`p-3.5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                      selectedAddressId === "new"
                        ? "border-[#166534] bg-emerald-50/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      + Use Different Address
                    </span>
                    <span className="text-[10px] text-slate-400">Fill details below</span>
                  </div>
                </div>
              </div>
            )}

            {/* Address Form Inputs (Only shown when adding a new address or if no saved addresses exist) */}
            {(savedAddresses.length === 0 || selectedAddressId === "new") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bishal Biswas"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Street / House / Area Address *
                  </label>
                  <input
                    required
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House #, Road #, Sector / Ward / Village"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    City / Region *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                  >
                    <option value="Dhaka">Dhaka (Inside Dhaka - ৳60 Shipping)</option>
                    <option value="Chattogram">Chattogram (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Sylhet">Sylhet (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Rajshahi">Rajshahi (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Khulna">Khulna (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Barishal">Barishal (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Rangpur">Rangpur (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Mymensingh">Mymensingh (Outside Dhaka - ৳120 Shipping)</option>
                    <option value="Other">Other Region (Outside Dhaka - ৳120 Shipping)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Postal / Zip Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 1213"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery Notes / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Special courier instructions, near mosque, 3rd floor, etc."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Shipping Speed & Logistics Options */}
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Shipping Method
                </h2>
                <p className="text-[11px] text-slate-400">Select courier fulfillment speed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  shippingSpeed === "standard"
                    ? "border-[#166534] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingSpeed"
                    checked={shippingSpeed === "standard"}
                    onChange={() => setShippingSpeed("standard")}
                    className="accent-[#166534]"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Standard Delivery</p>
                    <p className="text-[11px] text-slate-500">
                      {isOutsideDhaka ? "3-5 business days" : "24 to 48 hours"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ৳{baseShippingCost}
                </span>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  shippingSpeed === "express"
                    ? "border-[#166534] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingSpeed"
                    checked={shippingSpeed === "express"}
                    onChange={() => setShippingSpeed("express")}
                    className="accent-[#166534]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-slate-900 dark:text-white">Express Courier</p>
                      <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[9px] font-bold">
                        FAST
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Next day priority dispatch</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ৳{baseShippingCost + 90}
                </span>
              </label>
            </div>
          </div>

          {/* 3. Payment Method Selection */}
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Payment Method
                </h2>
                <p className="text-[11px] text-slate-400">All transactions are secured with 256-bit SSL</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: PortPos Payment Gateway */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === "portpos"
                    ? "border-[#166534] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="portpos"
                    checked={paymentMethod === "portpos"}
                    onChange={() => setPaymentMethod("portpos")}
                    className="accent-[#166534]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        PortPos Payment Gateway
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cards (Visa, MasterCard), bKash, Nagad, Rocket, Upay & Net Banking
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-base shrink-0">
                  <span>💳</span>
                  <span>📱</span>
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === "cod"
                    ? "border-[#166534] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-[#166534]"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay in cash when your package arrives at your door
                    </p>
                  </div>
                </div>
                <span className="text-lg shrink-0">💵</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Order Summary & Totals (Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Order Summary ({checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""})
              </h3>
              {!isDirect && (
                <Link to="/cart" className="text-xs font-bold text-emerald-600 hover:underline">
                  Edit Cart
                </Link>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin divide-y divide-slate-100 dark:divide-slate-900">
              {checkoutItems.map((it, idx) => {
                const pId = it.product?._id || it.product?.id || it.product;
                const itemImg =
                  it.product?.images?.[0]?.url ||
                  it.product?.images?.[0] ||
                  "https://placehold.co/100x100?text=Item";
                const itemPrice = Number(
                  it.variant?.discountPrice ||
                    it.variant?.price ||
                    it.product?.discountPrice ||
                    it.product?.basePrice ||
                    it.product?.price ||
                    0
                );
                const lineTotal = itemPrice * (it.quantity || 1);

                return (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0">
                      <img src={itemImg} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {it.product?.title || "Product"}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {it.variant?.name ? `Variant: ${it.variant.name} • ` : ""}Qty: {it.quantity || 1}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        ৳{lineTotal.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(pId)}
                        className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        title="Remove from checkout"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Application */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Promo / Coupon Code
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#166534]/20 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isApplyingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{isApplyingCoupon ? "Checking..." : "Apply"}</span>
                </button>
              </div>

              {couponError && <p className="text-[11px] font-semibold text-rose-500">{couponError}</p>}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                  <span className="font-bold">
                    ✓ Code {appliedCoupon.code} Applied (-৳{discountAmount})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Shipping ({city})</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ৳{shippingCost.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-৳{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Tax / Fees</span>
                <span className="font-bold text-slate-900 dark:text-white">৳0.00</span>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-baseline justify-between text-slate-900 dark:text-white">
                <span className="text-sm font-black">Total Payable</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">Including VAT & local duties</p>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full py-3.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order • ৳{grandTotal.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust & Guarantee Badges */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>256-Bit SSL Encrypted:</strong> Your personal & payment info is protected.
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>7 Days Return Policy:</strong> Easy exchange or full refund if damaged.
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Verified Logistics:</strong> Doorstep tracking and delivery confirmation.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
