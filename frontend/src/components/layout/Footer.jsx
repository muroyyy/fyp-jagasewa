import React from 'react';
import { Home, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    // If not on landing page, navigate to landing page first
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      // Already on landing page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <footer className="bg-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">JagaSewa</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Saving Malaysian landlords 5+ hours every week through smart property management automation.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-slate-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Kuala Lumpur, Malaysia</span>
              </div>
              <div className="flex items-center text-slate-400">
                <Mail className="w-4 h-4 mr-2" />
                <a href="mailto:support@jagasewa.com" className="hover:text-blue-600 transition-colors">
                  support@jagasewa.com
                </a>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('solutions')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Solutions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/signup')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Start Free Trial
                </button>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <a 
                  href="mailto:support@jagasewa.com" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@jagasewa.com" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => navigate('/login')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Login
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/signup')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Sign Up
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/forgot-password')}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Forgot Password
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-400">
                © 2025 JagaSewa. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Developed by Amirul Faiz - Asia Pacific University Final Year Project
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}