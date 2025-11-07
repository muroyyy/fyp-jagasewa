import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import jagasewaLogo from '../assets/jagasewa-logo-2.svg';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    // If not on landing page, navigate to landing page first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
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
    setMobileMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => navigate('/')}
              className="w-12 h-12 flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer"
            >
              <img src={jagasewaLogo} alt="JagaSewa" className="w-12 h-12" />
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('solutions')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium hover:scale-105 transform cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition-all font-semibold cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 bg-white">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('solutions')}
              className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="block w-full text-left px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="block w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}