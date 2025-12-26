import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Phone, Building2, MapPin, ArrowRight, AlertCircle, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';
import TermsModal from '../../components/modals/TermsModal';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SignupLandlord() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, or false
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+601',
    password: '',
    confirmPassword: '',
    companyName: '',
    ssmNumber: '',
    address: '',
    agreeToTerms: false
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [ssmVerified, setSsmVerified] = useState(false);
  const [showVerificationNote, setShowVerificationNote] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle phone number input with max length
    if (name === 'phone') {
      // Remove all non-digit characters except the + at the start
      let cleaned = value.replace(/[^\d+]/g, '');
      
      // Ensure it starts with +601
      if (!cleaned.startsWith('+601')) {
        cleaned = '+601';
      }
      
      // Limit to +601 + 9 digits (total 13 characters)
      if (cleaned.length > 13) {
        cleaned = cleaned.slice(0, 13);
      }
      
      // Format as +601X XXX XXXX
      let formatted = cleaned;
      if (cleaned.length > 5) {
        formatted = cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
      }
      if (cleaned.length > 8) {
        formatted = cleaned.slice(0, 5) + ' ' + cleaned.slice(5, 8) + ' ' + cleaned.slice(8);
      }
      
      setFormData({
        ...formData,
        [name]: formatted
      });
      
      if (error) setError('');
      return;
    }
    
    // Handle password match checking
    if (name === 'confirmPassword') {
      const newConfirmPassword = value;
      if (newConfirmPassword === '') {
        setPasswordMatch(null);
      } else if (formData.password === newConfirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    }
    
    if (name === 'password') {
      const newPassword = value;
      if (formData.confirmPassword === '') {
        setPasswordMatch(null);
      } else if (newPassword === formData.confirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSsmVerification = async () => {
    if (!formData.ssmNumber || formData.ssmNumber.length !== 12) {
      setError('Please enter a valid 12-digit SSM number');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    setShowVerificationNote(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-ssm.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssm_number: formData.ssmNumber
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSsmVerified(true);
        setShowVerificationNote(false);
      } else {
        setError(result.message);
        setShowVerificationNote(false);
      }
    } catch (error) {
      console.error('SSM verification error:', error);
      setError('Network error during SSM verification. Please try again.');
      setShowVerificationNote(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    if (!ssmVerified) {
      setError('Please verify your SSM number first');
      return;
    }
    
    // Validate phone number format
    const phoneDigitsOnly = formData.phone.replace(/\D/g, '');
    if (phoneDigitsOnly.length < 12 || phoneDigitsOnly.length > 13) {
      setError('Please enter a valid Malaysian phone number (+601X XXX XXXX)');
      return;
    }

    setIsLoading(true);

    // Check for duplicate email and phone
    try {
      const duplicateCheckResponse = await fetch(`${API_BASE_URL}/api/auth/check-duplicates.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone.replace(/\s/g, ''),
          ssm_number: formData.ssmNumber,
          user_role: 'landlord'
        })
      });

      const duplicateResult = await duplicateCheckResponse.json();
      
      if (!duplicateResult.success) {
        setError(duplicateResult.message);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      // Continue with registration if duplicate check fails
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          user_role: 'landlord',
          full_name: formData.fullName,
          phone: formData.phone.replace(/\s/g, ''), // Remove spaces before sending
          company_name: formData.companyName,
          ssm_number: formData.ssmNumber,
          address: formData.address
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Landlord account created successfully!');
        navigate('/login');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img 
              src={jagasewaLogo} 
              alt="JagaSewa" 
              className="h-16 w-auto"
            />
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Landlord Registration</h2>
          </div>
          <p className="text-gray-600">Create your landlord account to start managing properties</p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Registration Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email and Phone - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="+601X XXX XXXX"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: +601X XXX XXXX (10-11 digits)</p>
              </div>
            </div>

            {/* Company Name and SSM Number - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your Property Management Company"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ssmNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  SSM Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ssmNumber"
                    name="ssmNumber"
                    value={formData.ssmNumber}
                    onChange={handleChange}
                    required
                    maxLength="12"
                    pattern="[0-9]{12}"
                    inputMode="numeric"
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      handleChange(e);
                    }}
                    disabled={isLoading || ssmVerified}
                    className={`w-full pl-4 pr-20 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      ssmVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="123456789012"
                  />
                  {!ssmVerified && (
                    <button
                      type="button"
                      onClick={handleSsmVerification}
                      disabled={isLoading || isVerifying || formData.ssmNumber.length !== 12}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                  {ssmVerified && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {ssmVerified ? '✓ SSM number verified' : 'Enter 12-digit Malaysian business registration number'}
                </p>
              </div>
            </div>

            {/* SSM Verification Note */}
            {showVerificationNote && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3 mt-0.5"></div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Verifying SSM Number...</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Note: In a production system, this would verify against the actual Companies Commission of Malaysia (SSM) API.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  rows="3"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your full address"
                />
              </div>
            </div>

            {/* Password and Confirm Password - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                    disabled={isLoading}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="8"
                    disabled={isLoading}
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      passwordMatch === null ? 'border-gray-300 focus:ring-blue-500' :
                      passwordMatch ? 'border-green-500 focus:ring-green-500' :
                      'border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  
                  {/* Password Match Indicator */}
                  {passwordMatch !== null && formData.confirmPassword !== '' && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      {passwordMatch ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Password Match Text */}
                {passwordMatch !== null && formData.confirmPassword !== '' && (
                  <p className={`text-xs mt-1 ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 disabled:cursor-not-allowed"
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                >
                  Terms and Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center group ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-800 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Landlord Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Role Selection */}
        <div className="text-center mt-6">
          <Link
            to="/signup"
            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center"
          >
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            Back to role selection
          </Link>
        </div>
      </div>

      {/* Modals */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} type="terms" />
      <TermsModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} type="privacy" />
    </div>
  );
}