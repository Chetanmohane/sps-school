import { useState } from 'react';

export function useSharedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setSharedState = (value: T | ((val: T) => T)) => {
    setState((prevState) => {
      const nextState = value instanceof Function ? value(prevState) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextState));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
      return nextState;
    });
  };

  return [state, setSharedState] as const;
}
