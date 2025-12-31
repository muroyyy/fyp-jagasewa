// Session management state
let sessionExpiryCallback = null;
let sessionWarningShown = false;

// Set session expiry callback
export const setSessionExpiryCallback = (callback) => {
  sessionExpiryCallback = callback;
};

// Clear session data
const clearSession = () => {
  localStorage.removeItem('session_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  sessionWarningShown = false;
};

// Handle session expiry with modal
export const handleSessionExpiry = (response, navigate) => {
  if (response.status === 401) {
    const data = response.json ? response.json() : null;
    
    // Check if it's a session warning (30 seconds left) or actual expiry
    if (data && data.session_warning && !sessionWarningShown) {
      sessionWarningShown = true;
      if (sessionExpiryCallback) {
        sessionExpiryCallback({
          type: 'warning',
          timeLeft: data.time_left || 60,
          onExtend: () => extendSession(),
          onLogout: () => {
            clearSession();
            navigate('/login');
          }
        });
      }
      return false; // Don't logout yet, show warning
    } else {
      // Actual session expiry
      clearSession();
      if (sessionExpiryCallback) {
        sessionExpiryCallback({ type: 'expired' });
      }
      navigate('/login');
      return true;
    }
  }
  return false;
};

// Extend session
export const extendSession = async () => {
  try {
    const token = localStorage.getItem('session_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/extend-session.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      sessionWarningShown = false;
      if (sessionExpiryCallback) {
        sessionExpiryCallback({ type: 'extended' });
      }
      return true;
    } else {
      throw new Error(data.message || 'Failed to extend session');
    }
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
};

// Enhanced fetch with session handling
export const fetchWithAuth = async (url, options = {}, navigate) => {
  const token = localStorage.getItem('session_token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // Check for session warning in headers
    if (response.headers.get('X-Session-Warning') === 'true') {
      const timeLeft = parseInt(response.headers.get('X-Time-Left') || '30');
      if (sessionExpiryCallback && !sessionWarningShown) {
        sessionWarningShown = true;
        sessionExpiryCallback({
          type: 'warning',
          timeLeft: timeLeft,
          onExtend: () => extendSession(),
          onLogout: () => {
            clearSession();
            navigate('/login');
          }
        });
      }
    }
    
    // Check for session expiry
    if (handleSessionExpiry(response, navigate)) {
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};