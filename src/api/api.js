import axios from "axios";

const api = axios.create({
  baseURL: "https://vmdfix-backend1.onrender.com/api",
});

export const getWallet = (userId) => api.get(`/wallet/${userId}`);
export const getLedger = (userId) => api.get(`/wallet/${userId}/ledger`);
export const getPendingWithdrawals = () =>
  api.get("/admin/withdrawals?status=PENDING");

export const BACKEND_BASE = "https://vmdfix-backend1.onrender.com";

/** Normalize any imageUrl to a full URL — handles relative /uploads/ paths from old DB records */
export const normalizeImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return BACKEND_BASE + url;
  return url;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Always store and return full absolute URL
  return data.url.startsWith("http") ? data.url : BACKEND_BASE + data.url;
};

export default api;
