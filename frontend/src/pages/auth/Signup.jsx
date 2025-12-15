import React from 'react';
import { Building2, User, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';

export default function Signup() {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    if (role === 'landlord') {
      navigate('/signup/landlord');
    } else if (role === 'tenant') {
      navigate('/signup/tenant');
    }
  };

  const landlordBenefits = [
    'Manage multiple properties',
    'Track rent payments automatically',
    'Handle maintenance requests',
    'Generate financial reports'
  ];

  const tenantBenefits = [
    'Pay rent online securely',
    'Submit maintenance requests',
    'Access important documents',
    'Receive payment reminders'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img 
              src={jagasewaLogo} 
              alt="JagaSewa" 
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-xl text-gray-600">Choose your role to get started</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Landlord Card */}
          <div 
            onClick={() => handleRoleSelection('landlord')}
            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:border-blue-500 transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">I'm a Landlord</h3>
              <p className="text-gray-600 mb-6">
                Manage your properties and tenants efficiently
              </p>
              
              {/* Benefits List */}
              <div className="w-full space-y-3 mb-6">
                {landlordBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start text-left">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center group-hover:translate-x-1 cursor-pointer">
                Sign up as Landlord
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tenant Card */}
          <div 
            onClick={() => handleRoleSelection('tenant')}
            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:border-green-500 transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">I'm a Tenant</h3>
              <p className="text-gray-600 mb-6">
                Simplify your rental experience with online tools
              </p>
              
              {/* Benefits List */}
              <div className="w-full space-y-3 mb-6">
                {tenantBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start text-left">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center group-hover:translate-x-1 cursor-pointer">
                Sign up as Tenant
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Already Have Account */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline cursor-pointer"
            >
              Sign in here
            </Link>
          </p>
        </div>

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