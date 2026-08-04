import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_API_URL !== undefined
    ? process.env.REACT_APP_API_URL
    : process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:5001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const connectSocket = (token?: string) => {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export default getSocket;
