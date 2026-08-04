import { useEffect, useRef, useCallback } from "react";
import { getSocket } from "../socket";

/**
 * useRealtime - A hook that listens to one or more socket events
 * and calls the provided callback (e.g. fetchData) when they fire.
 *
 * Usage:
 *   useRealtime(["STUDENT_CHANGED", "ADMISSION_CHANGED"], fetchStudents);
 */
const useRealtime = (events: string | string[], callback: () => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handler = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const eventList = Array.isArray(events) ? events : [events];

    // Connect if not connected
    if (!socket.connected) {
      const token = localStorage.getItem("token") || undefined;
      if (token) socket.auth = { token };
      socket.connect();
    }

    // Register listeners
    eventList.forEach((event) => {
      socket.on(event, handler);
    });

    // Also listen for generic DATA_CHANGED
    const dataChangedHandler = (payload: { event: string }) => {
      if (eventList.includes(payload.event)) {
        callbackRef.current();
      }
    };
    socket.on("DATA_CHANGED", dataChangedHandler);

    return () => {
      eventList.forEach((event) => {
        socket.off(event, handler);
      });
      socket.off("DATA_CHANGED", dataChangedHandler);
    };
  }, [events, handler]);
};

export default useRealtime;
