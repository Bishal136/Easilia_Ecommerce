import { createSlice } from "@reduxjs/toolkit";

const loadCartFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("dealport_cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const initialState = {
  items: loadCartFromStorage(),
  directBuyItem: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, variant = null } = action.payload;
      const productId = product._id || product.id;
      const existing = state.items.find(
        (it) => (it.product._id || it.product.id) === productId
      );

      if (existing) {
        existing.quantity += quantity;
        if (variant) existing.variant = variant;
      } else {
        state.items.push({
          product,
          quantity,
          variant,
        });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("dealport_cart", JSON.stringify(state.items));
      }
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(
        (it) => (it.product._id || it.product.id) === productId
      );
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(
            (it) => (it.product._id || it.product.id) !== productId
          );
        } else {
          item.quantity = quantity;
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("dealport_cart", JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (it) => (it.product._id || it.product.id) !== productId
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("dealport_cart", JSON.stringify(state.items));
      }
    },
    setDirectBuyItem: (state, action) => {
      state.directBuyItem = action.payload;
    },
    clearDirectBuyItem: (state) => {
      state.directBuyItem = null;
    },
    clearCart: (state) => {
      state.items = [];
      state.directBuyItem = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("dealport_cart");
      }
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  setDirectBuyItem,
  clearDirectBuyItem,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
