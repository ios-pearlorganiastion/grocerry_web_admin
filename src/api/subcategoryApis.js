import api from "./axios";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

export const getSubcategories = async (params = {}) => {
  try {
    const response = await api.get("/subcategories", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    throw new Error(getErrorMessage(error, "Failed to load subcategories."));
  }
};

export const getSubcategoriesByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/subcategories/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategories for category:", error);
    throw new Error(getErrorMessage(error, "Failed to load subcategories for category."));
  }
};

export const getSubcategory = async (id) => {
  try {
    const response = await api.get(`/subcategories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    throw new Error(getErrorMessage(error, "Failed to load subcategory."));
  }
};

export const createSubcategory = async (data) => {
  try {
    const response = await api.post("/subcategories", data);
    return response.data;
  } catch (error) {
    console.error("Error creating subcategory:", error);
    throw new Error(getErrorMessage(error, "Failed to create subcategory."));
  }
};

export const updateSubcategory = async (id, data) => {
  try {
    const response = await api.patch(`/subcategories/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating subcategory:", error);
    throw new Error(getErrorMessage(error, "Failed to update subcategory."));
  }
};

export const deleteSubcategory = async (id) => {
  try {
    const response = await api.delete(`/subcategories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    throw new Error(getErrorMessage(error, "Failed to delete subcategory."));
  }
};

export default {
  getSubcategories,
  getSubcategoriesByCategory,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
