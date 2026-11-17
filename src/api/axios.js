
import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes("cdshoppinghub.com")) {
      return `${window.location.protocol}//api.cdshoppinghub.com`;
    }
    return window.location.origin;
  }
  return "https://api.cdshoppinghub.com";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 40000,
});

api.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      const session = JSON.parse(
        localStorage.getItem("staffSession") || "null"
      );
      token = session?.accessToken;
    } catch {}

    if (!token) {
      token =
        localStorage.getItem("staffToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token.replace(/^Bearer\s+/i, "").trim()}`;
    }

    if (config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("staffSession");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
