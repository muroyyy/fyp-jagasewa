import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

const SessionExpiryModal = ({ isOpen, onExtend, onLogout, mode = 'warning', timeLeft: initialTimeLeft = 60 }) => {
  const [extending, setExtending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || mode !== 'warning') return;
    
    setTimeLeft(initialTimeLeft);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout(); // Auto logout when timer reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, initialTimeLeft, mode, onLogout]);

  const handleExtend = async () => {
    setExtending(true);
    try {
      await onExtend();
    } finally {
      setExtending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {mode === 'warning' ? 'Session Expiring Soon' : 'Session Expired'}
          </h2>
          <p className="text-gray-600 mb-4">
            {mode === 'warning'
              ? 'Your session will expire in'
              : 'Your session expired due to inactivity. Please log in again.'}
          </p>
          
          {mode === 'warning' && (
            <>
              {/* Countdown Display */}
              <div className="mb-6">
                <div className={`text-3xl font-bold mb-2 ${
                  timeLeft <= 10 ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {timeLeft}s
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      timeLeft <= 10 ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${(timeLeft / initialTimeLeft) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Would you like to extend your session?
              </p>
            </>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {mode === 'warning' ? 'Log In Again' : 'Go to Login'}
            </button>
            
            {mode === 'warning' && (
              <button
                onClick={handleExtend}
                disabled={extending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {extending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {extending ? 'Extending...' : 'Extend Session'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiryModal;
