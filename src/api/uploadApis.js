import api from "./axios";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

export const uploadProductImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/uploads/product-image", formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading product image:", error);
    throw new Error(getErrorMessage(error, "Failed to upload product image."));
  }
};

export const uploadProductImages = async (productId, files = []) => {
  try {
    const formData = new FormData();
    if (productId) formData.append("productId", productId);

    if (Array.isArray(files)) {
      files.forEach((file) => formData.append("files", file));
    } else if (files) {
      formData.append("files", files);
    }

    const response = await api.post("/uploads/product-images", formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading product images:", error);
    throw new Error(getErrorMessage(error, "Failed to upload product images."));
  }
};

export default {
  uploadProductImage,
  uploadProductImages,
};
