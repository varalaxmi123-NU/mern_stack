import axios from "axios";

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? "http://localhost:5000/api" : "/api");
export const SERVER_URL = isLocal ? "http://localhost:5000" : "";

// Turns a resume/file value into a URL that always points at the backend.
export const resolveFileUrl = (link) => {
  if (!link) return "";
  if (link.startsWith("/uploads")) return `${SERVER_URL}${link}`;
  return link;
};

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach the saved token to every request automatically (if present)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Friendly response interceptor for server connection handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && error.request) {
      error.message = "Couldn't reach the backend server. Please make sure the server is running on port 5000.";
    }
    return Promise.reject(error);
  }
);

export default API;
