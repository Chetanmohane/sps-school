import React, { useState, useEffect } from 'react';
import AppRoutes from './AppRoutes';
import { ThemeProvider } from './context/ThemeContext';

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  }
}

function App() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'info' | 'error' }>>([]);

  useEffect(() => {
    // Expose showToast globally
    window.showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    // Override native window.alert to route through showToast
    window.alert = (message: string) => {
      const isSuccess = /success|succeed|added|created|saved|updated|paid|approved|enroll/i.test(message);
      window.showToast(message, isSuccess ? 'success' : 'info');
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="App">
        <AppRoutes />
        
        {/* Gorgeous Global Toast Notifications Overlay */}
        <div
          id="custom-react-toast-container"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
            maxWidth: '400px',
            width: 'calc(100% - 48px)',
          }}
        >
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateY(-20px) scale(0.95);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
          `}</style>
          {toasts.map((t) => {
            const isDarkMode = document.documentElement.classList.contains('dark-mode');
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            
            return (
              <div
                key={t.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  backgroundColor: isDarkMode ? 'rgba(22, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${
                    isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(226, 232, 240, 0.8)'
                  }`,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#F1F5F9' : '#1F2937',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  pointerEvents: 'auto',
                  animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {isSuccess ? '✅' : isError ? '❌' : 'ℹ️'}
                </span>
                <div style={{ flex: 1 }}>{t.message}</div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '22px',
                    color: isDarkMode ? '#94A3B8' : '#6B7280',
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: 1,
                    outline: 'none',
                  }}
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
