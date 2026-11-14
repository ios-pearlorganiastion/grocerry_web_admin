import api from "./axios";

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Failed to change password.";

const changeStaffPassword = async (passwordData) => {
  try {
    const response = await api.post("/staff/change-password", passwordData);
    return response.data;
  } catch (error) {
    console.error("Error changing staff password:", error);
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export default changeStaffPassword;
