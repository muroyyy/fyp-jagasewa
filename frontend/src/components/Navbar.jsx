import React, { useState, useEffect } from 'react';
import { Home, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
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
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setMobileMenuOpen(false); // Close mobile menu after clicking
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => navigate('/')}
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-pointer"
            >
              <Home className="w-7 h-7 text-white" />
            </div>
            <span 
              onClick={() => navigate('/')}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
            >
              JagaSewaaaa
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Benefits
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
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition-all font-medium cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            <a href="#features" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">
              Features
            </a>
            <a href="#benefits" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">
              Benefits
            </a>
            <a href="#about" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">
              About
            </a>
            <button className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-left">
              Login
            </button>
            <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}