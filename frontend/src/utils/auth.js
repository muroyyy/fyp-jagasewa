/**
 * Authentication Utilities
 * Handles user session management
 */

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Get session token
export const getSessionToken = () => {
  return localStorage.getItem('session_token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const user = getCurrentUser();
  const token = getSessionToken();
  return !!(user && token);
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  return user && user.user_role === requiredRole;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('session_token');
  window.location.href = '/login';
};

// Get user profile data
export const getUserProfile = () => {
  const user = getCurrentUser();
  return user ? user.profile : null;
};

// Update user data in localStorage
export const updateUserData = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

// Check if user is landlord
export const isLandlord = () => {
  return hasRole('landlord');
};

// Check if user is tenant
export const isTenant = () => {
  return hasRole('tenant');
};