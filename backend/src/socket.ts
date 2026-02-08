import { Server } from "socket.io";

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for dev/demo. In prod, use env.CORS_ORIGIN
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a specific room (e.g. "order_123", "user_456")
    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
    });

    // Cleaner location update
    socket.on("cleaner_location", (data) => {
      // data: { cleanerId, lat, lng, orderId }
      // Broadcast to the specific order room (for the user)
      if (data.orderId) {
        io.to(`order_${data.orderId}`).emit("cleaner_location_update", data);
      }
      // Broadcast to admin room
      io.to("admin_dashboard").emit("admin_cleaner_update", data);
    });

    // Admin join
    socket.on("join_admin", () => {
      socket.join("admin_dashboard");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}
