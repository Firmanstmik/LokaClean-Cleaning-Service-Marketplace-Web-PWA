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


