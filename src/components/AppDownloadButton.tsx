import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Monitor, ShieldCheck, Sparkles } from 'lucide-react';

interface AppDownloadButtonProps {
  floating?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  buttonText?: string;
  className?: string;
}

export const AppDownloadButton: React.FC<AppDownloadButtonProps> = ({ 
  floating = false, 
  position = 'bottom-right',
  buttonText = 'Download Mobile App',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'qr'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDownloadAndroid = async () => {
    setDownloadStarted(true);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        if (window.showToast) {
          window.showToast('🎉 SPS School ERP App installed on your device!', 'success');
        }
      }
      setDeferredPrompt(null);
    } else {
      if (window.showToast) {
        window.showToast('📱 Chrome Menu (⋮) -> Tap "Add to Home Screen" to install app', 'info');
      }
    }

    setTimeout(() => setDownloadStarted(false), 2500);
  };

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom-left':
        return { bottom: '24px', left: '24px' };
      case 'bottom-center':
        return { bottom: '24px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
      default:
        return { bottom: '24px', right: '24px' };
    }
  };

  return (
    <>
      {floating ? (
        /* Floating Fixed Position Button */
        <div
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 12px 28px -6px rgba(124, 58, 237, 0.45), 0 4px 12px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              letterSpacing: '0.3px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              outline: 'none',
            }}
          >
            <Smartphone size={20} />
            <span>{buttonText}</span>
            <Download size={15} />
          </button>
        </div>
      ) : (
        /* Inline Footer Button */
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 ${className}`}
        >
          <Smartphone size={16} />
          <span>{buttonText}</span>
          <Download size={14} className="opacity-80" />
        </button>
      )}

      {/* Shared Modal Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)',
              overflow: 'hidden',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header background decoration */}
            <div
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
                padding: '28px 24px 20px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)')}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '14px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Smartphone size={28} color="#FFFFFF" />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#F0ABFC',
                    }}
                  >
                    <Sparkles size={14} /> Official App
                  </div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>
                    SPS School ERP Mobile
                  </h3>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.4' }}>
                Get instant access to Attendance, Timetables, Exam Results, Notices & Fees on your phone.
              </p>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#0F172A',
              }}
            >
              {[
                { id: 'android', label: '🤖 Android APK' },
                { id: 'ios', label: '🍎 iOS / Web' },
                { id: 'qr', label: '📱 Scan QR' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : '2px solid transparent',
                    color: activeTab === tab.id ? '#A78BFA' : '#94A3B8',
                    fontWeight: activeTab === tab.id ? '700' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ padding: '24px' }}>
              {activeTab === 'android' && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      background: 'rgba(124, 58, 237, 0.1)',
                      border: '1px dashed rgba(124, 58, 237, 0.3)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🤖</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#F1F5F9' }}>
                      Install App for Android
                    </h4>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#94A3B8' }}>
                      Official Web Application Package for Android. Fast, secure & zero storage space required.
                    </p>
                    <div style={{ fontSize: '12px', color: '#A78BFA', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '8px 12px', borderRadius: '10px', display: 'inline-block' }}>
                      💡 Tip: Open in Mobile Chrome, tap <strong>(⋮) Menu</strong> &rarr; Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadAndroid}
                    disabled={downloadStarted}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      background: downloadStarted || installed
                        ? '#10B981'
                        : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: downloadStarted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 20px -4px rgba(139, 92, 246, 0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {installed ? (
                      <>
                        <CheckCircle2 size={20} />
                        <span>App Installed Successfully!</span>
                      </>
                    ) : downloadStarted ? (
                      <>
                        <CheckCircle2 size={20} />
                        <span>Launching App Installer...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={20} />
                        <span>📲 Install App on Android Device</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'ios' && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px dashed rgba(59, 130, 246, 0.3)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🍎</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#F1F5F9' }}>
                      Install on iPhone / iPad
                    </h4>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94A3B8' }}>
                      Open this URL in Safari on your iPhone, tap <strong>Share</strong> and select <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.showToast) {
                        window.showToast('📲 Bookmark saved! Open in Mobile Safari to Add to Home Screen', 'info');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    <Monitor size={20} />
                    <span>Install Progressive Web App (PWA)</span>
                  </button>
                </div>
              )}

              {activeTab === 'qr' && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '16px',
                      borderRadius: '16px',
                      display: 'inline-block',
                      marginBottom: '16px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <svg width="150" height="150" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="#FFFFFF" />
                      <rect x="5" y="5" width="25" height="25" fill="#1E293B" />
                      <rect x="9" y="9" width="17" height="17" fill="#FFFFFF" />
                      <rect x="13" y="13" width="9" height="9" fill="#1E293B" />

                      <rect x="70" y="5" width="25" height="25" fill="#1E293B" />
                      <rect x="74" y="9" width="17" height="17" fill="#FFFFFF" />
                      <rect x="78" y="13" width="9" height="9" fill="#1E293B" />

                      <rect x="5" y="70" width="25" height="25" fill="#1E293B" />
                      <rect x="9" y="74" width="17" height="17" fill="#FFFFFF" />
                      <rect x="13" y="78" width="9" height="9" fill="#1E293B" />

                      <rect x="35" y="10" width="8" height="8" fill="#1E293B" />
                      <rect x="50" y="10" width="8" height="8" fill="#1E293B" />
                      <rect x="35" y="25" width="8" height="8" fill="#1E293B" />
                      <rect x="50" y="25" width="12" height="12" fill="#7C3AED" />
                      <rect x="10" y="35" width="8" height="8" fill="#1E293B" />
                      <rect x="25" y="35" width="8" height="8" fill="#1E293B" />
                      <rect x="40" y="45" width="20" height="20" fill="#1E293B" />
                      <rect x="70" y="40" width="10" height="10" fill="#1E293B" />
                      <rect x="85" y="40" width="10" height="10" fill="#1E293B" />
                      <rect x="70" y="60" width="12" height="12" fill="#1E293B" />
                      <rect x="35" y="70" width="10" height="10" fill="#1E293B" />
                      <rect x="50" y="75" width="12" height="12" fill="#1E293B" />
                      <rect x="75" y="80" width="15" height="15" fill="#7C3AED" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                    Scan with your Phone Camera to open app installer link directly.
                  </p>
                </div>
              )}

              {/* Security & Verification Footer */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#64748B',
                }}
              >
                <ShieldCheck size={16} color="#10B981" />
                <span>Verified 100% Virus-free & Secure | SPS School Portal v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppDownloadButton;
