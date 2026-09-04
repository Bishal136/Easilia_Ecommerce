import { useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useGoogleLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";

/**
 * Custom hook to handle Google OAuth authentication with Google Identity Services (GSI)
 * and OAuth2 token clients.
 */
export const useGoogleAuth = ({ onError, role = "user" } = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [googleLogin, { isLoading }] = useGoogleLoginMutation();
  const tokenClientRef = useRef(null);

  const handleCredentialResponse = useCallback(
    async (response) => {
      try {
        const idToken = response?.credential || response?.access_token;
        if (!idToken) {
          throw new Error("No Google credential received");
        }

        const result = await googleLogin({
          credential: response.credential,
          idToken: response.credential,
          accessToken: response.access_token,
          role,
        }).unwrap();

        const data = result?.data || result;
        const user = data?.user;
        const token = data?.accessToken || data?.token;
        const shop = data?.shop;

        if (user && token) {
          dispatch(
            setCredentials({
              user: { ...user, shop: shop || user.shop },
              token,
            })
          );

          const redirectFrom = location.state?.from?.pathname;
          if (redirectFrom && redirectFrom !== "/login" && redirectFrom !== "/register") {
            navigate(redirectFrom, { replace: true });
          } else if (user.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (user.role === "seller") {
            navigate("/seller/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }
      } catch (err) {
        console.error("Google Auth error:", err);
        const message =
          err?.data?.message ||
          err?.message ||
          "Google authentication failed. Please verify your Google account or sign in with email.";
        if (onError) onError(message);
      }
    },
    [googleLogin, dispatch, navigate, location, onError, role]
  );

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "618728729484-m4qpomhngmtbb95d6u9r4d3giv8i0al4.apps.googleusercontent.com";

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn("GSI init notice:", e);
        }
      }

      // Initialize OAuth2 Token Client as a direct fallback
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "openid email profile",
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                if (onError) onError(`Google error: ${tokenResponse.error_description || tokenResponse.error}`);
                return;
              }
              if (tokenResponse?.access_token) {
                try {
                  // Fetch user profile using access token
                  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  const userInfo = await userInfoRes.json();

                  if (userInfo?.email) {
                    // Send to backend login endpoint
                    const result = await googleLogin({
                      accessToken: tokenResponse.access_token,
                      idToken: tokenResponse.access_token,
                      userInfo: {
                        sub: userInfo.sub,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                      },
                      role,
                    }).unwrap();

                    const data = result?.data || result;
                    const user = data?.user;
                    const token = data?.accessToken || data?.token;
                    const shop = data?.shop;

                    if (user && token) {
                      dispatch(
                        setCredentials({
                          user: { ...user, shop: shop || user.shop },
                          token,
                        })
                      );

                      const redirectFrom = location.state?.from?.pathname;
                      if (redirectFrom && redirectFrom !== "/login" && redirectFrom !== "/register") {
                        navigate(redirectFrom, { replace: true });
                      } else if (user.role === "admin") {
                        navigate("/admin/dashboard", { replace: true });
                      } else if (user.role === "seller") {
                        navigate("/seller/dashboard", { replace: true });
                      } else {
                        navigate("/", { replace: true });
                      }
                    }
                  }
                } catch (err) {
                  console.error("OAuth2 userinfo error:", err);
                  if (onError) onError("Failed to process Google sign-in. Please use email sign-in.");
                }
              }
            },
          });
        } catch (e) {
          console.warn("OAuth2 client init notice:", e);
        }
      }
    };

    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      initGsi();
    } else {
      const existingScript = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGsi;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", initGsi);
      }
    }
  }, [handleCredentialResponse, googleLogin, dispatch, navigate, location, onError, role]);

  const triggerGoogleLogin = () => {
    try {
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken({ prompt: "consent" });
        return;
      }

      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (onError) {
              onError(
                "Google origin authorization required: Please add 'http://localhost:5173' to 'Authorized JavaScript origins' in Google Cloud Console."
              );
            }
          }
        });
      } else {
        if (onError) {
          onError("Google Sign-In is initializing. Please try again in a few seconds.");
        }
      }
    } catch (err) {
      if (onError) {
        onError("Google Sign-In could not be opened. Please verify Google Cloud Console origin settings.");
      }
    }
  };

  return { triggerGoogleLogin, isGoogleLoading: isLoading };
};

export default useGoogleAuth;
