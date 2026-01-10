import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { setSessionExpiryCallback, extendSession, clearSessionStorage } from './utils/sessionHandler';
import SessionExpiryModal from './components/shared/SessionExpiryModal';
import AppRoutes from './routes';

function App() {
  const [sessionModal, setSessionModal] = useState({ isOpen: false, mode: 'warning', timeLeft: 60 });
  const idleStateRef = useRef({ lastActivity: Date.now(), warningShown: false, expiredShown: false });

  const IDLE_WARNING_MINUTES = 110;
  const IDLE_MAX_MINUTES = 120;
  const IDLE_CHECK_INTERVAL_MS = 1000;

  const redirectToLogin = () => {
    clearSessionStorage();
    window.location.href = '/login';
  };

  const closeSessionModal = () => {
    setSessionModal({ isOpen: false, mode: 'warning', timeLeft: 60 });
  };

  const showExpiredModal = (onLogout) => {
    setSessionModal({
      isOpen: true,
      mode: 'expired',
      timeLeft: 0,
      onLogout: onLogout || redirectToLogin
    });
  };

  // Set up session expiry callback
  useEffect(() => {
    setSessionExpiryCallback((data) => {
      if (data.type === 'warning') {
        setSessionModal({
          isOpen: true,
          mode: 'warning',
          timeLeft: data.timeLeft,
          onExtend: async () => {
            const success = await data.onExtend();
            if (success) {
              closeSessionModal();
            }
          },
          onLogout: () => {
            closeSessionModal();
            data.onLogout();
          }
        });
      } else if (data.type === 'expired') {
        showExpiredModal(data.onLogout);
      } else if (data.type === 'extended') {
        closeSessionModal();
      }
    });
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      idleStateRef.current.lastActivity = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    window.addEventListener('focus', handleActivity);
    document.addEventListener('visibilitychange', handleActivity);

    const intervalId = setInterval(() => {
      const hasSession = !!localStorage.getItem('session_token');
      if (!hasSession) {
        idleStateRef.current.warningShown = false;
        idleStateRef.current.expiredShown = false;
        return;
      }

      const idleMs = Date.now() - idleStateRef.current.lastActivity;
      const warningMs = IDLE_WARNING_MINUTES * 60 * 1000;
      const maxMs = IDLE_MAX_MINUTES * 60 * 1000;

      if (idleMs >= maxMs) {
        if (!idleStateRef.current.expiredShown) {
          idleStateRef.current.expiredShown = true;
          showExpiredModal();
        }
        return;
      }

      if (idleMs >= warningMs && !idleStateRef.current.warningShown) {
        idleStateRef.current.warningShown = true;
        const timeLeftSeconds = Math.max(1, Math.ceil((maxMs - idleMs) / 1000));
        setSessionModal({
          isOpen: true,
          mode: 'warning',
          timeLeft: timeLeftSeconds,
          onExtend: async () => {
            const success = await extendSession();
            if (success) {
              idleStateRef.current.lastActivity = Date.now();
              idleStateRef.current.warningShown = false;
              idleStateRef.current.expiredShown = false;
              closeSessionModal();
            } else {
              showExpiredModal();
            }
            return success;
          },
          onLogout: () => {
            idleStateRef.current.warningShown = false;
            idleStateRef.current.expiredShown = true;
            redirectToLogin();
          }
        });
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      window.removeEventListener('focus', handleActivity);
      document.removeEventListener('visibilitychange', handleActivity);
    };
  }, []);

  return (
    <Router>
      <AppRoutes />
      <SessionExpiryModal
        isOpen={sessionModal.isOpen}
        mode={sessionModal.mode}
        timeLeft={sessionModal.timeLeft}
        onExtend={sessionModal.onExtend}
        onLogout={sessionModal.onLogout}
      />
    </Router>
  );
}

export default App;
