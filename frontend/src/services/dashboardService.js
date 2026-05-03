

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});



export const getDashboardStats = async () => {
  try {
    const response = await api.get("/api/dashboard/stats");

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch dashboard stats",
    };
  }
};



export const getUserCredits = async () => {
  try {
    const response = await api.get("/api/dashboard/credits");

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch credits",
    };
  }
};



export const getAnalysisHistory = async () => {
  try {
    const response = await api.get(
      "/api/dashboard/history"
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch analysis history",
    };
  }
};



export const purchaseCredits = async (planId) => {
  try {
    const response = await api.post(
      "/api/dashboard/purchase-credits",
      {
        planId,
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Credit purchase failed",
    };
  }
};
