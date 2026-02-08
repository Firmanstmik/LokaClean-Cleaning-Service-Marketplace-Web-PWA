import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
// Remove /api suffix for socket connection (Socket.io usually runs on root or distinct namespace, 
// but here we assume it runs on the same port at root path)
const SOCKET_URL = API_URL.replace(/\/api$/, "");

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false, // We connect manually when needed (e.g. after login)
    });
    
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });
    
    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
