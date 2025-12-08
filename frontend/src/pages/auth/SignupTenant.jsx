import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Phone, Calendar, IdCard, ArrowRight, AlertCircle, Check, X, Upload, Loader, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SignupTenant() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);
  
  // IC Verification states
  const [icFrontFile, setIcFrontFile] = useState(null);
  const [icBackFile, setIcBackFile] = useState(null);
  const [icFrontPreview, setIcFrontPreview] = useState(null);
  const [icBackPreview, setIcBackPreview] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'error'
  const [extractedData, setExtractedData] = useState(null);
  const [icUrls, setIcUrls] = useState({ front: null, back: null });
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+601',
    icNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone') {
      if (!value.startsWith('+601')) return;
      const digitsOnly = value.slice(4).replace(/\D/g, '');
      const limitedDigits = digitsOnly.slice(0, 9);
      let formatted = '+601';
      if (limitedDigits.length > 0) {
        formatted += limitedDigits[0];
        if (limitedDigits.length > 1) {
          if (limitedDigits.length <= 4) {
            formatted += ' ' + limitedDigits.slice(1);
          } else if (limitedDigits.length <= 7) {
            formatted += ' ' + limitedDigits.slice(1, 4) + ' ' + limitedDigits.slice(4);
          } else {
            formatted += ' ' + limitedDigits.slice(1, 4) + ' ' + limitedDigits.slice(4, 8);
          }
        }
      }
      setFormData({ ...formData, [name]: formatted });
      if (error) setError('');
      return;
    }

    if (name === 'icNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      let formatted = digitsOnly;
      if (digitsOnly.length > 6) {
        formatted = digitsOnly.slice(0, 6) + '-' + digitsOnly.slice(6);
      }
      if (digitsOnly.length > 8) {
        formatted = digitsOnly.slice(0, 6) + '-' + digitsOnly.slice(6, 8) + '-' + digitsOnly.slice(8, 12);
      }
      setFormData({ ...formData, [name]: formatted });
      if (error) setError('');
      return;
    }
    
    if (name === 'confirmPassword') {
      setPasswordMatch(value === '' ? null : formData.password === value);
    }
    
    if (name === 'password') {
      setPasswordMatch(formData.confirmPassword === '' ? null : value === formData.confirmPassword);
    }
    
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (error) setError('');
  };

  const handleICUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must not exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') {
        setIcFrontFile(file);
        setIcFrontPreview(reader.result);
      } else {
        setIcBackFile(file);
        setIcBackPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const verifyIC = async () => {
    if (!icFrontFile || !icBackFile) {
      setError('Please upload both IC front and back images');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ic_front', icFrontFile);
      formData.append('ic_back', icBackFile);

      const response = await fetch(`${API_BASE_URL}/api/tenant/verify-ic.php`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setVerificationStatus('success');
        setExtractedData(result.extracted_data);
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          fullName: result.extracted_data.name || prev.fullName,
          icNumber: result.extracted_data.ic_number || prev.icNumber,
          dateOfBirth: result.extracted_data.date_of_birth || prev.dateOfBirth
        }));
      } else {
        setVerificationStatus('error');
        setError(result.message || 'IC verification failed');
      }
    } catch (error) {
      console.error('IC verification error:', error);
      setVerificationStatus('error');
      setError('Network error during IC verification');
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



    setIsLoading(true);

    try {
      const duplicateCheckResponse = await fetch(`${API_BASE_URL}/api/auth/check-duplicates.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone.replace(/\s/g, ''),
          ic_number: formData.icNumber,
          user_role: 'tenant'
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
    }

    try {
      const checkResponse = await fetch(`${API_BASE_URL}/api/auth/check-tenant-status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const checkResult = await checkResponse.json();
      
      let endpoint = '/api/auth/signup.php';
      let requestBody = {
        email: formData.email,
        password: formData.password,
        user_role: 'tenant',
        full_name: formData.fullName,
        phone: formData.phone,
        ic_number: formData.icNumber,
        date_of_birth: formData.dateOfBirth,
        ic_verified: extractedData ? 1 : 0,
        ic_verification_data: extractedData || null
      };

      if (checkResult.exists && checkResult.status === 'pending') {
        endpoint = '/api/auth/complete-tenant-registration.php';
        requestBody.verify_details = true;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        alert(checkResult.exists && checkResult.status === 'pending' 
          ? '✅ Account activated successfully! You can now login.'
          : '✅ Tenant account created successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img src={jagasewaLogo} alt="JagaSewa" className="h-16 w-auto" />
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Tenant Registration</h2>
          </div>
          <p className="text-gray-600">Create your tenant account with AI-powered IC verification</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Registration Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* IC Verification Section */}
          {!useManualEntry && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center mb-4">
              <IdCard className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Malaysian IC Verification (Optional)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Upload your IC for instant verification using AWS AI</p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* IC Front */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">IC Front</label>
                <div className="relative">
                  {icFrontPreview ? (
                    <div className="relative">
                      <img src={icFrontPreview} alt="IC Front" className="w-full h-40 object-cover rounded-lg border-2 border-green-300" />
                      <button
                        type="button"
                        onClick={() => { setIcFrontFile(null); setIcFrontPreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload IC Front</span>
                      <input type="file" accept="image/*" onChange={(e) => handleICUpload(e, 'front')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* IC Back */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">IC Back</label>
                <div className="relative">
                  {icBackPreview ? (
                    <div className="relative">
                      <img src={icBackPreview} alt="IC Back" className="w-full h-40 object-cover rounded-lg border-2 border-green-300" />
                      <button
                        type="button"
                        onClick={() => { setIcBackFile(null); setIcBackPreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload IC Back</span>
                      <input type="file" accept="image/*" onChange={(e) => handleICUpload(e, 'back')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {icFrontFile && icBackFile && !verificationStatus && (
              <button
                type="button"
                onClick={verifyIC}
                disabled={isVerifying}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
              >
                {isVerifying ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Verifying with AWS Textract...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify IC with AI
                  </>
                )}
              </button>
            )}

            {verificationStatus === 'success' && extractedData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">IC Verified Successfully!</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>✓ Confidence: {extractedData.confidence}%</p>
                  <p>✓ Fields extracted: {extractedData.fields_extracted}/{extractedData.total_fields}</p>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">Verification Failed</span>
                </div>
              </div>
            )}

            {/* Manual Entry Option */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setUseManualEntry(true)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Or enter details manually
              </button>
            </div>
          </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
                {extractedData?.name && <Check className="inline w-4 h-4 text-green-600 ml-2" />}
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
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            {/* Email and Phone */}
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="jane@example.com"
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
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    maxLength="17"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="+601x xxx xxxx"
                  />
                </div>
              </div>
            </div>

            {/* IC Number and DOB - Manual or Auto-filled */}
            {(extractedData || useManualEntry) && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="icNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    IC Number {extractedData && <Check className="inline w-4 h-4 text-green-600 ml-2" />}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="icNumber"
                      name="icNumber"
                      value={formData.icNumber}
                      onChange={handleChange}
                      readOnly={extractedData !== null}
                      required
                      disabled={isLoading}
                      maxLength="14"
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        extractedData ? 'border-green-300 bg-green-50 cursor-not-allowed' : 'border-gray-300 bg-white'
                      } disabled:bg-gray-100`}
                      placeholder="XXXXXX-XX-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth {extractedData && <Check className="inline w-4 h-4 text-green-600 ml-2" />}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      readOnly={extractedData !== null}
                      required
                      disabled={isLoading}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        extractedData ? 'border-green-300 bg-green-50 cursor-not-allowed' : 'border-gray-300 bg-white'
                      } disabled:bg-gray-100`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
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
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 ${
                      passwordMatch === null ? 'border-gray-300 focus:ring-green-500' :
                      passwordMatch ? 'border-green-500 focus:ring-green-500' :
                      'border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {passwordMatch !== null && formData.confirmPassword !== '' && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      {passwordMatch ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </div>
                {passwordMatch !== null && formData.confirmPassword !== '' && (
                  <p className={`text-xs mt-1 ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-green-600 hover:text-green-700 font-medium">Terms and Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-green-600 hover:text-green-700 font-medium">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center group ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-teal-600'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Tenant Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/signup" className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center">
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
}
