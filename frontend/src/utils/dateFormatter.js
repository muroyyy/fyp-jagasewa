/**
 * Date formatting utilities for Malaysian date format (DD-MM-YYYY)
 */

/**
 * Format date to DD-MM-YYYY
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
export const formatDateMY = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format date to DD-MM-YYYY HH:MM
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string with time
 */
export const formatDateTimeMY = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Convert DD-MM-YYYY to YYYY-MM-DD for input fields
 * @param {string} dateStr - Date string in DD-MM-YYYY format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const convertToInputFormat = (dateStr) => {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

/**
 * Convert YYYY-MM-DD to DD-MM-YYYY
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Date string in DD-MM-YYYY format
 */
export const convertFromInputFormat = (dateStr) => {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
