import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Phone, Building2, MapPin, ArrowRight, AlertCircle, Check, X, Calendar, Users, FileText, Shield } from 'lucide-react';
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
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyData, setCompanyData] = useState(null);

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
    
    if (!formData.companyName.trim()) {
      setError('Please enter company name before verification');
      return;
    }
    
    if (!formData.address.trim()) {
      setError('Please enter company address before verification');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    setShowVerificationNote(true);
    
    try {
      // Mock SSM API response with company details
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Generate random dates
      const currentYear = new Date().getFullYear();
      const establishedYear = Math.floor(Math.random() * (currentYear - 2000)) + 2000; // Random year between 2000 and current year
      const establishedMonth = Math.floor(Math.random() * 12) + 1; // Random month 1-12
      const establishedDay = Math.floor(Math.random() * 28) + 1; // Random day 1-28 (safe for all months)
      const establishedDate = `${establishedYear}-${establishedMonth.toString().padStart(2, '0')}-${establishedDay.toString().padStart(2, '0')}`;
      
      const lastUpdatedYear = Math.floor(Math.random() * (currentYear - establishedYear + 1)) + establishedYear; // Random year between established year and current year
      const lastUpdatedMonth = Math.floor(Math.random() * 12) + 1;
      const lastUpdatedDay = Math.floor(Math.random() * 28) + 1;
      const lastUpdatedDate = `${lastUpdatedYear}-${lastUpdatedMonth.toString().padStart(2, '0')}-${lastUpdatedDay.toString().padStart(2, '0')}`;
      
      // Mock company data based on SSM number and company name
      const mockCompanyData = {
        companyName: formData.companyName,
        registrationNumber: formData.ssmNumber,
        dateOfEstablishment: establishedDate,
        companyType: 'Private Limited Company (Sdn. Bhd.)',
        status: 'Active',
        registeredAddress: formData.address,
        businessNature: 'Real Estate Activities',
        lastUpdated: lastUpdatedDate
      };
      
      setCompanyData(mockCompanyData);
      setShowVerificationNote(false);
      setShowCompanyModal(true);
      
    } catch (error) {
      console.error('SSM verification error:', error);
      setError('Network error during SSM verification. Please try again.');
      setShowVerificationNote(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleConfirmCompany = () => {
    setSsmVerified(true);
    setShowCompanyModal(false);
  };
  
  const handleRejectCompany = () => {
    setCompanyData(null);
    setShowCompanyModal(false);
    setError('Company verification cancelled. Please check your details and try again.');
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
                  placeholder="Full name"
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
                    placeholder="Email address"
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

            {/* Company Name */}
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
                  disabled={isLoading || ssmVerified}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    ssmVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Company name"
                />
              </div>
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Company Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={isLoading || ssmVerified}
                  rows="4"
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    ssmVerified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter complete company address"
                />
              </div>
            </div>

            {/* SSM Number */}
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
                  placeholder="SSM number (12 digits)"
                />
                {!ssmVerified && (
                  <button
                    type="button"
                    onClick={handleSsmVerification}
                    disabled={isLoading || isVerifying || formData.ssmNumber.length !== 12 || !formData.companyName.trim() || !formData.address.trim()}
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
                {ssmVerified ? '✓ Company verified with SSM' : 'Enter company name and address first, then verify SSM number'}
              </p>
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed cursor-pointer"
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed cursor-pointer"
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

      {/* Company Verification Modal */}
      {showCompanyModal && companyData && (
        <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Company Verification</h3>
                    <p className="text-sm text-gray-600">Please confirm your company details</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                  <Shield className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-700">SSM Verified</span>
                </div>
              </div>

              {/* Company Details Card */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Name</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{companyData.companyName}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Number</label>
                      <p className="text-gray-900 font-mono mt-1">{companyData.registrationNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Type</label>
                      <p className="text-gray-900 mt-1">{companyData.companyType}</p>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">Status</label>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {companyData.status}
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Established</label>
                        <p className="text-gray-900">{new Date(companyData.dateOfEstablishment).toLocaleDateString('en-MY')}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Nature</label>
                      <p className="text-gray-900 mt-1">{companyData.businessNature}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</label>
                      <p className="text-gray-600 text-sm mt-1">{new Date(companyData.lastUpdated).toLocaleDateString('en-MY')}</p>
                    </div>
                  </div>
                </div>

                {/* Registered Address */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered Address</label>
                      <p className="text-gray-900 mt-1">{companyData.registeredAddress}</p>
                    </div>
                  </div>
                </div>


              </div>

              {/* Confirmation Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Please confirm the details above</p>
                    <p className="text-xs text-blue-700 mt-1">
                      By confirming, you acknowledge that the company information displayed is accurate and matches your business registration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleRejectCompany}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCompany}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} type="terms" />
      <TermsModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} type="privacy" />
    </div>
  );
}