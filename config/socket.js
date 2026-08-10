const { Server } = require("socket.io");

let io = null;

const allowedOrigins = [
  "https://sps-school-frontend.onrender.com",
  "https://sps-school.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
  "http://localhost:5001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000"
];

const checkOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("vercel.app") ||
    origin.includes("onrender.com")
  ) {
    return callback(null, true);
  }
  return callback(null, true);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: checkOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Real-time socket client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized yet!");
  }
  return io;
};

const notifyChange = (event, data = {}) => {
  if (io) {
    io.emit(event, data);
    io.emit("DATA_CHANGED", { event, data, timestamp: new Date() });
    console.log(`📡 Broadcasted live update event: [${event}]`);
  }
};

module.exports = { initSocket, getIO, notifyChange };
