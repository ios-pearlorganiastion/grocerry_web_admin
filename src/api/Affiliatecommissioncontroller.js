import api from "./axios";


export const updateAffiliateCommission = async (
  affiliateId,
  customCommissionRate
) => {
  try {
    const response = await api.patch(
      `/affiliates/${affiliateId}/commission`,
      {
        customCommissionRate,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Update Affiliate Commission Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export const getAllAffiliates = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/affiliates", {
      params: {
        page,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Get Affiliates Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};



export const resetAffiliateCommission = async (affiliateId) => {
  try {
    const response = await api.patch(
      `/affiliates/${affiliateId}/commission`,
      {
        customCommissionRate: null,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Reset Affiliate Commission Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// Update Global Commission Settings

export const updateGlobalCommission = async (data) => 
  {
  try 
  {
    const response = await api.patch("/affiliates/settings", data);
    return response.data;
  } catch (error) 
  {
    console.error(
      "Update Global Commission Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get Affiliate By ID

export const getAffiliateById = async (affiliateId) => 
  {
  try 
  {
    const response = await api.get(`/affiliates/${affiliateId}`);
    return response.data;
  } catch (error) 
  {
    console.error(
      "Get Affiliate By ID Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};