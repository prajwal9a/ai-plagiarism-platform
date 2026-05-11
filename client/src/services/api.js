import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("rop_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authAPI = {
  login: (payload) => api.post("/auth/login", payload),
  signup: (payload) => api.post("/auth/signup", payload),
  me: () => api.get("/auth/me"),
};

export const plagiarismAPI = {
  check: (payload) =>
    api.post(
      "/check-plagiarism",
      payload
    ),

  improve: (payload) =>
    api.post(
      "/improve-text",
      payload
    ),

  uploadFile: (formData) =>
    api.post(
      "/upload-file",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  generateReport: (payload) =>
    api.post(
      "/generate-report",
      payload,
      {
        responseType: "blob",
      }
    ),

  history: () =>
    api.get("/reports/history"),

  saveReport: (payload) =>
    api.post(
      "/reports/save",
      payload
    ),
};

export const stripeAPI = {
  checkout: () =>
    api.post(
      "/stripe/create-checkout-session"
    ),
};

export default api;