/**
 * Axios API client.
 *
 * - Uses VITE_API_BASE_URL (defaults to local backend)
 * - Attaches JWT automatically
 */

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lokaclean_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const actor = localStorage.getItem("lokaclean_actor");
      
      localStorage.removeItem("lokaclean_token");
      localStorage.removeItem("lokaclean_actor");

      // Avoid redirect loops if already on login pages
      const path = window.location.pathname;
      if (path === "/login" || path === "/admin/login") {
        return Promise.reject(error);
      }

      // Determine redirect target based on actor type
      const target = actor === "ADMIN" ? "/admin/login" : "/login";
      window.location.href = target;

      // Return a pending promise to halt downstream error handling (prevent UI error flashes)
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);


