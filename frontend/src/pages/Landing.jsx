import React, { useState, useEffect } from 'react';
import { Home, Users, DollarSign, Wrench, FileText, Bell, BarChart3, Shield, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const landlordFeatures = [
    { icon: Home, title: "Property Management", desc: "Manage all your properties in one place" },
    { icon: Users, title: "Tenant Management", desc: "Track tenant information and lease agreements" },
    { icon: DollarSign, title: "Rent Tracking", desc: "Automated rent collection and payment tracking" },
    { icon: Wrench, title: "Maintenance Requests", desc: "Handle repairs and maintenance efficiently" },
    { icon: BarChart3, title: "Reports & Analytics", desc: "Insights into your property portfolio" },
    { icon: Shield, title: "Role-Based Access", desc: "Secure access control for your team" }
  ];

  const tenantFeatures = [
    { icon: DollarSign, title: "Online Rent Payment", desc: "Pay rent securely online anytime" },
    { icon: Bell, title: "Smart Notifications", desc: "Never miss a payment deadline" },
    { icon: Wrench, title: "Maintenance Requests", desc: "Submit and track maintenance issues" },
    { icon: FileText, title: "Document Access", desc: "Access your lease and important documents" }
  ];

  const stats = [
    { number: "500+", label: "Properties Managed" },
    { number: "1000+", label: "Happy Tenants" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Simplify Property Management with
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                  JagaSewa
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                The all-in-one cloud platform that connects landlords and tenants. Manage properties, track payments, and handle maintenance requests effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all font-semibold text-lg flex items-center justify-center group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:shadow-lg transition-all font-semibold text-lg border-2 border-gray-200">
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600">No credit card required</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600">14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Animation */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-500">
                <div className="space-y-6">
                  {[
                    { label: "Total Properties", value: "24", color: "blue" },
                    { label: "Active Tenants", value: "18", color: "green" },
                    { label: "Pending Payments", value: "3", color: "yellow" }
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl bg-${item.color}-50 border border-${item.color}-200 animate-pulse`} style={{ animationDelay: `${idx * 200}ms` }}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">{item.label}</span>
                        <span className={`text-2xl font-bold text-${item.color}-600`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl opacity-20 blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Landlord Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Landlords</h2>
            <p className="text-xl text-gray-600">Everything you need to manage your properties efficiently</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landlordFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenant Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamless Experience for Tenants</h2>
            <p className="text-xl text-gray-600">Simple tools to manage your rental experience</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tenantFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 shadow-md">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-gray-900">Why Choose JagaSewa?</h2>
              <div className="space-y-6">
                {[
                  "Cloud-based accessibility from anywhere, anytime",
                  "Automated rent tracking and payment reminders",
                  "Streamlined communication between landlords and tenants",
                  "Comprehensive reporting and analytics dashboard",
                  "Secure document storage and management",
                  "Built on reliable AWS infrastructure"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-blue-100 text-lg mb-8">Join hundreds of landlords and tenants already using JagaSewa to simplify their property management.</p>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all font-bold text-lg"
              >
                Create Free Account
              </button>
              <p className="text-center text-blue-100 text-sm mt-4">No credit card required • 14-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}