import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { setSessionExpiryCallback } from './utils/sessionHandler';
import SessionExpiryModal from './components/shared/SessionExpiryModal';
import AppRoutes from './routes';

function App() {
  const [sessionModal, setSessionModal] = useState({ isOpen: false, timeLeft: 60 });

  // Set up session expiry callback
  React.useEffect(() => {
    setSessionExpiryCallback((data) => {
      if (data.type === 'warning') {
        setSessionModal({
          isOpen: true,
          timeLeft: data.timeLeft,
          onExtend: async () => {
            const success = await data.onExtend();
            if (success) {
              setSessionModal({ isOpen: false, timeLeft: 60 });
            }
          },
          onLogout: () => {
            setSessionModal({ isOpen: false, timeLeft: 60 });
            data.onLogout();
          }
        });
      } else if (data.type === 'extended') {
        setSessionModal({ isOpen: false, timeLeft: 60 });
      }
    });
  }, []);

  return (
    <Router>
      <AppRoutes />
      <SessionExpiryModal
        isOpen={sessionModal.isOpen}
        timeLeft={sessionModal.timeLeft}
        onExtend={sessionModal.onExtend}
        onLogout={sessionModal.onLogout}
      />
    </Router>
  );
}

export default App;