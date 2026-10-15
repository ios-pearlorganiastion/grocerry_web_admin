import api from "./axios";

const normalizeToken = (value) => {
  if (!value) return null;

  const token = String(value)
    .replace(/^Bearer\s+/i, "")
    .trim();

  return token || null;
};

export const staffLogin = async (credentials) => {
  const response = await api.post(
    "/auth/staff/login",
    credentials
  );

  const result = response.data;

  const token = normalizeToken(
    result?.data?.accessToken ||
      result?.data?.token ||
      result?.data?.access_token ||
      result?.accessToken ||
      result?.token ||
      result?.access_token
  );

  if (!token) {
    throw new Error(
      result?.message ||
        "Login successful but staff access token was not received."
    );
  }

  const staff =
    result?.data?.staff ||
    result?.staff ||
    null;

  localStorage.setItem("staffToken", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("authToken", token);
  localStorage.setItem("token", token);

  localStorage.setItem(
    "staffSession",
    JSON.stringify({
      accessToken: token,
      staff,
    })
  );

  return result;
};

export const staffRegister = async (registrationData, bootstrapSecret = "") => {
  try {
    const headers = {};
    const secret =
      bootstrapSecret ||
      localStorage.getItem("staffBootstrapSecret") ||
      localStorage.getItem("bootstrapSecret");

    if (secret) {
      headers["x-staff-bootstrap-secret"] = secret;
    }

    const response = await api.post("/auth/staff/register", registrationData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering staff:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to register staff account.";
    throw new Error(message);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to load authenticated user details.";
    throw new Error(message);
  }
};

export const getMe = getCurrentUser;

export const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("Error checking health status:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Service health check failed.";
    throw new Error(message);
  }
};

export default {
  staffLogin,
  staffRegister,
  getCurrentUser,
  getMe,
  checkHealth,
};