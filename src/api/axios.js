
import axios from "axios";

const api = axios.create({
  // baseURL: "http://72.62.228.103:3000",
  baseURL: "https://api.cdshoppinghub.com",
  //baseURL: "https://2np24kf8-3001.inc1.devtunnels.ms",
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
