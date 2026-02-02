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

    // Handle User Deleted (404 with specific message)
    // Check multiple possible error message locations and loose matching
    const errorData = error.response?.data;
    const errorMsg = errorData?.error?.message || errorData?.message || "";
    
    // Normalize to lower case for comparison
    const lowerMsg = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : "";
    
    // Check if the request was for the profile endpoint
    const requestUrl = error.config?.url || "";
    const isProfileRequest = requestUrl.includes("/users/me") || requestUrl.includes("/admins/me");

    const isUserNotFound = error.response?.status === 404 && 
      (lowerMsg.includes("user account not found") || 
       lowerMsg.includes("admin account not found") || 
       lowerMsg.includes("user not found") ||
       isProfileRequest); // Fallback: if /me returns 404, the user is definitely gone

    if (isUserNotFound) {
      console.log("[AutoLogout] User not found detected. Initiating logout sequence.");
      
      // Show floating alert
      const msg = document.createElement('div');
      msg.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                    background-color: #ef4444; color: white; padding: 16px 24px; 
                    border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); 
                    z-index: 9999; font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 500;
                    display: flex; align-items: center; gap: 12px; animation: slideDown 0.5s ease-out forwards;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 14px;">User account not found</span>
            <span style="font-size: 12px; opacity: 0.9;">Redirecting to registration in 5 seconds...</span>
          </div>
        </div>
        <style>
          @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(msg);

      // Logout and redirect after 5 seconds
      setTimeout(() => {
        localStorage.removeItem("lokaclean_token");
        localStorage.removeItem("lokaclean_actor");
        
        // Remove the alert
        if (msg.parentNode) {
          msg.parentNode.removeChild(msg);
        }

        window.location.href = "/register";
      }, 5000);

      // Return a pending promise to halt downstream error handling
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);


