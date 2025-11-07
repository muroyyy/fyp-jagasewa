// Session expiry handler utility
export const handleSessionExpiry = (response, navigate) => {
  if (response.status === 401 || (response.ok && response.json && response.json().message === 'Session expired')) {
    // Clear local storage
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Show popup message
    alert('⚠️ Your session has expired. Please login again to continue.');
    
    // Redirect to login
    navigate('/login');
    return true;
  }
  return false;
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