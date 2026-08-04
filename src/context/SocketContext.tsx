import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "../socket";

interface SocketContextType {
  socket: Socket | null;
  onEvent: (event: string, callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onEvent: () => () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || undefined;
    const s = connectSocket(token);
    socketRef.current = s;

    s.on("connect", () => {
      console.log("⚡ Real-time socket connected:", s.id);
    });

    s.on("disconnect", () => {
      console.log("🔌 Real-time socket disconnected");
    });

    s.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const onEvent = useCallback((event: string, callback: (data: any) => void) => {
    const s = getSocket();
    s.on(event, callback);
    // Also subscribe to the generic DATA_CHANGED event
    const dataChangedHandler = (payload: { event: string; data: any }) => {
      if (payload.event === event) {
        callback(payload.data);
      }
    };
    s.on("DATA_CHANGED", dataChangedHandler);
    return () => {
      s.off(event, callback);
      s.off("DATA_CHANGED", dataChangedHandler);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
