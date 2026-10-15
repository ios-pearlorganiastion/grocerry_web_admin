import api from "./axios";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PACKED",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export const getOrders = async ({
  page = 1,
  limit = 20,
  status = "",
} = {}) => {
  try {
    const params = {
      page,
      limit,
      ...(status ? { status } : {}),
    };

    const response = await api.get("/orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error(getErrorMessage(error, "Failed to load orders."));
  }
};

export const getAllOrders = async (page = 1, limit = 20) => {
  return getOrders({ page, limit, status: "" });
};

export const getOrdersByStatus = async (status, page = 1, limit = 20) => {
  if (status && !ORDER_STATUSES.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }

  return getOrders({ page, limit, status });
};

export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw new Error(getErrorMessage(error, "Failed to load order details."));
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error(getErrorMessage(error, "Failed to update order status."));
  }
};

export const confirmOrderPayment = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/confirm-payment`);
    return response.data;
  } catch (error) {
    console.error("Error confirming order payment:", error);
    throw new Error(getErrorMessage(error, "Failed to confirm order payment."));
  }
};

export const getOrderStats = async () => {
  try {
    const response = await api.get("/orders/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    throw new Error(getErrorMessage(error, "Failed to load order statistics."));
  }
};

export const getDeliveryFeeInfo = async () => {
  try {
    const response = await api.get("/orders/delivery-fee-info");
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery fee info:", error);
    throw new Error(
      getErrorMessage(error, "Failed to load delivery fee info.")
    );
  }
};

export default {
  ORDER_STATUSES,
  getOrders,
  getAllOrders,
  getOrdersByStatus,
  getOrderById,
  updateOrderStatus,
  confirmOrderPayment,
  getOrderStats,
  getDeliveryFeeInfo,
};