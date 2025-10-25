import React, { useState } from 'react';
import { Home, Mail, ArrowRight, ArrowLeft, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// API Base URL
const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        // Store reset data (token and link) for display
        if (result.dev_only) {
          setResetData(result.dev_only);
        }
      } else {
        setError(result.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (resetData && resetData.reset_link) {
      navigator.clipboard.writeText(resetData.reset_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JagaSewa
            </span>
          </Link>

          {!isSubmitted ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-600">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Link Generated!</h2>
              <p className="text-gray-600">
                Your password reset link is ready
              </p>
            </>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {!isSubmitted ? (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center group ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating Link...
                    </>
                  ) : (
                    <>
                      Generate Reset Link
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success Message with Reset Link */}
              <div className="space-y-6">
                {/* Development Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Development Mode</p>
                  <p className="text-xs text-yellow-700">
                    In production, this link would be sent to your email. For FYP demonstration, the link is displayed below.
                  </p>
                </div>

                {/* Email Confirmation */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 text-center">
                    Password reset link generated for <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                {/* Reset Link Display */}
                {resetData && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Your Reset Link:</p>
                      <div className="bg-white border border-gray-300 rounded-lg p-3 break-all text-xs text-gray-800 font-mono">
                        {resetData.reset_link}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className="mt-3 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>

                    <div className="text-xs text-gray-600 space-y-2">
                      <p className="flex items-start">
                        <span className="mr-2">⏱️</span>
                        <span>This link will expire in 1 hour ({new Date(resetData.expires_at).toLocaleString()})</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2">🔒</span>
                        <span>For security, this token can only be used once</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {resetData && (
                    <button
                      onClick={() => navigate(`/reset-password?token=${resetData.token}`)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      Go to Reset Password
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                      setResetData(null);
                      setError('');
                    }}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Help */}
        {!isSubmitted && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline cursor-pointer">
                Contact Support
              </Link>
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center"
          >
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}