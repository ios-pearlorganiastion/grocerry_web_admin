import api from "./axios";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

export const getVariantInventory = async (variantId) => {
  try {
    const response = await api.get(`/inventory/${variantId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching variant inventory:", error);
    throw new Error(getErrorMessage(error, "Failed to load inventory."));
  }
};

export const receiveStock = async (variantId, stockData) => {
  try {
    const response = await api.post(`/inventory/${variantId}/receive`, stockData);
    return response.data;
  } catch (error) {
    console.error("Error receiving stock:", error);
    throw new Error(getErrorMessage(error, "Failed to add stock."));
  }
};

export const getInventoryTransactions = async (variantId) => {
  try {
    const response = await api.get(`/inventory/${variantId}/transactions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory transactions:", error);
    throw new Error(
      getErrorMessage(error, "Failed to load inventory transactions.")
    );
  }
};

export default {
  getVariantInventory,
  receiveStock,
  getInventoryTransactions,
};
