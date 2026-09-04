import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem("easilia_user") || localStorage.getItem("dealport_user");
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("easilia_token") || localStorage.getItem("dealport_token") || null;
  } catch {
    return null;
  }
};

const getInitialRefreshToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("easilia_refresh_token") || localStorage.getItem("dealport_refresh_token") || null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getInitialUser(),
  token: getInitialToken(),
  refreshToken: getInitialRefreshToken(),
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      if (user) state.user = user;
      if (token) state.token = token;
      if (refreshToken) state.refreshToken = refreshToken;
      state.error = null;

      if (typeof window !== "undefined") {
        if (user) {
          localStorage.setItem("easilia_user", JSON.stringify(user));
          localStorage.setItem("dealport_user", JSON.stringify(user));
        }
        if (token) {
          localStorage.setItem("easilia_token", token);
          localStorage.setItem("dealport_token", token);
        }
        if (refreshToken) {
          localStorage.setItem("easilia_refresh_token", refreshToken);
          localStorage.setItem("dealport_refresh_token", refreshToken);
        }
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("easilia_user");
        localStorage.removeItem("easilia_token");
        localStorage.removeItem("easilia_refresh_token");
        localStorage.removeItem("dealport_user");
        localStorage.removeItem("dealport_token");
        localStorage.removeItem("dealport_refresh_token");
      }
    },
  },
});

export const { setCredentials, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
