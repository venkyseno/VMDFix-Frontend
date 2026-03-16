import axios from "axios";

const api = axios.create({
  baseURL: "https://vmdfix-backend1.onrender.com/api",
});

export const getWallet = (userId) => api.get(`/wallet/${userId}`);
export const getLedger = (userId) => api.get(`/wallet/${userId}/ledger`);
export const getPendingWithdrawals = () =>
  api.get("/admin/withdrawals?status=PENDING");

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return `https://vmdfix-backend1.onrender.com${data.url}`;
};

export default api;
