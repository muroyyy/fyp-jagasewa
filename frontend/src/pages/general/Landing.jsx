import React, { useEffect } from 'react';
import { Home, Users, DollarSign, Wrench, FileText, Bell, BarChart3, Shield, ArrowRight, Check, Clock, TrendingUp, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { isAuthenticated, getUserRole } from '../../utils/auth';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    if (isAuthenticated()) {
      const role = getUserRole();
      if (role === 'landlord') {
        navigate('/landlord-dashboard');
      } else if (role === 'tenant') {
        navigate('/tenant-dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate]);

  const testimonials = [
    { quote: "Saves me 2 hours daily", author: "Kamal Basyir", role: "15 properties in Selangor" },
    { quote: "Rent collection improved 40%", author: "Yusof Danial", role: "28 units in KL" },
    { quote: "Best decision for my business", author: "Lim Po Keat", role: "32 properties in Johor" }
  ];

  const painPoints = [
    {
      problem: "Chasing Late Rent Payments Wastes Your Time",
      problemDesc: "Sending reminder messages, tracking who paid, following up with late tenants - it takes hours every month.",
      solution: "Automated Rent Tracking & Reminders",
      benefits: [
        "Automatic WhatsApp/email reminders 3 days before due date",
        "Real-time payment tracking dashboard",
        "One-click payment links for tenants (FPX, e-wallet, card)",
        "Instant notifications when rent is received"
      ],
      screenshotAlt: "Rent tracking dashboard showing automated reminders and payment status"
    },
    {
      problem: "Maintenance Requests Get Lost in WhatsApp Chats",
      problemDesc: "Tenants message you on WhatsApp, texts get buried, requests are forgotten, and tenants get frustrated.",
      solution: "Centralized Maintenance Request System",
      benefits: [
        "All requests in one organized dashboard with photos",
        "Priority levels (urgent, high, medium, low)",
        "Track status from submitted to completed",
        "Automatic updates sent to tenants"
      ],
      screenshotAlt: "Maintenance requests dashboard showing organized tickets with priority levels"
    },
    {
      problem: "Juggling Multiple Spreadsheets and Documents",
      problemDesc: "Tenant details in Excel, lease agreements in folders, payment records scattered - finding information takes forever.",
      solution: "All Property Data in One Secure Place",
      benefits: [
        "Complete tenant profiles with lease history",
        "Digital document storage (IC, agreements, receipts)",
        "Quick search and filtering",
        "Export reports with one click"
      ],
      screenshotAlt: "Property management dashboard showing tenant profiles and documents"
    }
  ];

  const comparisonData = [
    { task: "Rent Collection Reminders", manual: "30 min/month", jagasewa: "Automated ✓" },
    { task: "Payment Tracking", manual: "Excel sheets", jagasewa: "Real-time dashboard ✓" },
    { task: "Tenant Communication", manual: "WhatsApp chaos", jagasewa: "Organized inbox ✓" },
    { task: "Maintenance Requests", manual: "Lost in messages", jagasewa: "Tracked & prioritized ✓" },
    { task: "Document Storage", manual: "Folders & files", jagasewa: "Cloud-based & secure ✓" },
    { task: "Financial Reports", manual: "Manual calculation", jagasewa: "Auto-generated ✓" }
  ];

  const howItWorks = [
    { 
      step: "1", 
      title: "Sign Up Free", 
      desc: "Create your account in under 2 minutes. No credit card needed.",
      icon: "👤"
    },
    { 
      step: "2", 
      title: "Add Your Properties", 
      desc: "Import your properties and tenant details. We'll help you migrate.",
      icon: "🏠"
    },
    { 
      step: "3", 
      title: "Automate & Save Time", 
      desc: "Sit back while JagaSewa handles reminders, tracking, and notifications.",
      icon: "⚡"
    }
  ];

  const quickBenefits = [
    { icon: Clock, label: "Save 5+ hours/week", color: "blue" },
    { icon: TrendingUp, label: "40% faster rent collection", color: "green" },
    { icon: Zap, label: "Setup in 5 minutes", color: "purple" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT: Value Proposition */}
            <div className="space-y-6">
              {/* Target Audience Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-600 rounded-full text-sm font-semibold shadow-sm">
                <Home className="w-4 h-4 mr-2" />
                For Independent Landlords Managing 10-50 Properties
              </div>
              
              {/* Main Headline - Outcome Focused */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Stop Chasing Rent.
                <span className="block text-blue-600 mt-2">
                  Start Growing Your Business.
                </span>
              </h1>
              
              {/* Benefit-Focused Subheadline */}
              <p className="text-xl text-slate-500 leading-relaxed">
                JagaSewa saves you <span className="font-bold text-blue-600">5+ hours every week</span> by automating rent tracking, tenant communication, and maintenance requests.
              </p>

              {/* Quick Benefits Pills */}
              <div className="flex flex-wrap gap-4 pt-2">
                {quickBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg">
                    <benefit.icon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-slate-500">{benefit.label}</span>
                  </div>
                ))}
              </div>
              
              {/* Single Primary CTA */}
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-800 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer"
                >
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-slate-500">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span>Setup in 5 minutes</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT: Dashboard Mockup - SIMPLIFIED */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                {/* Key Metric - Rent Collection */}
                <div className="mb-6">
                  <h3 className="text-sm text-slate-500 mb-2 font-medium">This Month's Rent Collection</h3>
                  <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-1">RM 42,500</div>
                  <p className="text-sm text-slate-500 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-1" />
                    18 of 20 tenants paid on time
                  </p>
                </div>
                
                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <div className="text-xs text-slate-500 font-medium">Properties</div>
                  </div>
                  <div className="text-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">18</div>
                    <div className="text-xs text-slate-500 font-medium">Active Tenants</div>
                  </div>
                  <div className="text-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-xs text-slate-500 font-medium">Pending</div>
                  </div>
                </div>

                {/* Quick Action Hint */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-700 flex items-center">
                    <Bell className="w-4 h-4 text-blue-600 mr-2" />
                    <span><span className="font-semibold">2 reminders</span> sent automatically today</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST SECTION - Mock Testimonials ===== */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm mb-8 font-medium">
            Trusted by landlords managing 500+ properties across Malaysia
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold text-slate-800 mb-2">"{testimonial.quote}"</div>
                <p className="text-sm text-slate-500 font-medium">{testimonial.author}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 bg-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Get Started in 3 Simple Steps</h2>
            <p className="text-xl text-slate-500">From signup to automation in under 10 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200 text-center md:text-left">
                  <div className="text-6xl mb-4 flex justify-center md:justify-start">{step.icon}</div>
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold mb-4">
                    Step {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-500">{step.desc}</p>
                </div>
                
                {/* Arrow between steps */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              Start Your Free Trial Now
            </button>
          </div>
        </div>
      </section>

      {/* ===== PAIN POINTS & SOLUTIONS ===== */}
      <section id="solutions" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              How JagaSewa Solves Your Daily Challenges
            </h2>
            <p className="text-xl text-slate-500">
              Built specifically for Malaysian landlords managing 10-50 properties
            </p>
          </div>

          {painPoints.map((item, idx) => (
            <div key={idx} className={`grid md:grid-cols-2 gap-12 items-center mb-24 ${idx % 2 !== 0 ? 'md:grid-flow-dense' : ''}`}>
              
              {/* Content Side */}
              <div className={`text-center md:text-left ${idx % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                {/* Problem */}
                <div className="mb-8">
                  <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
                    <X className="w-4 h-4 mr-1" />
                    THE PROBLEM
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-3">{item.problem}</h3>
                  <p className="text-lg text-slate-500">{item.problemDesc}</p>
                </div>
                
                {/* Solution */}
                <div>
                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                    <Check className="w-4 h-4 mr-1" />
                    THE SOLUTION
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 mb-4">{item.solution}</h4>
                  <ul className="space-y-3">
                    {item.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start text-left">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        <span className="text-slate-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Screenshot Placeholder Side */}
              <div className={idx % 2 !== 0 ? 'md:col-start-1 md:row-start-1' : ''}>
                <div className="relative group">
                  {/* Placeholder for actual screenshot */}
                  <div className="bg-slate-100 rounded-xl shadow-2xl border-2 border-slate-200 aspect-video flex items-center justify-center overflow-hidden">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-500 font-semibold text-sm">
                        Screenshot Placeholder
                      </p>
                      <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
                        {item.screenshotAlt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="py-20 bg-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Manual Management vs JagaSewa
            </h2>
            <p className="text-xl text-slate-500">
              See how much time and hassle you'll save
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="p-4 md:p-6 text-left text-slate-700 font-bold text-sm md:text-lg">Task</th>
                  <th className="p-4 md:p-6 text-center text-slate-700 font-bold text-sm md:text-lg">Manual Method</th>
                  <th className="p-4 md:p-6 text-center bg-blue-600 text-white font-bold text-sm md:text-lg border-l-2 border-blue-700">
                    With JagaSewa
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={`border-t border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="p-4 md:p-6 font-semibold text-slate-800 text-sm md:text-base">{row.task}</td>
                    <td className="p-4 md:p-6 text-center text-slate-500 text-sm md:text-base">{row.manual}</td>
                    <td className="p-4 md:p-6 text-center bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-200 text-sm md:text-base">
                      {row.jagasewa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-12">
            <div className="inline-block bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <p className="text-3xl font-bold text-slate-800 mb-2">
                Save an average of <span className="text-green-500">5+ hours per week</span>
              </p>
              <p className="text-slate-500 mb-6">That's over 20 hours every month to focus on growing your business</p>
              <button 
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                Start Saving Time Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LANDLORD & TENANT FEATURES OVERVIEW ===== */}
      <section id="features" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Complete Features for Both Sides</h2>
            <p className="text-xl text-slate-500">Everything landlords and tenants need in one platform</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Landlord Features */}
            <div className="bg-slate-100 rounded-2xl p-8 border-2 border-slate-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">For Landlords</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: Home, text: "Centralized property dashboard" },
                  { icon: Users, text: "Complete tenant management" },
                  { icon: DollarSign, text: "Automated rent tracking & reminders" },
                  { icon: Wrench, text: "Maintenance request workflow" },
                  { icon: BarChart3, text: "Financial reports & analytics" },
                  { icon: Shield, text: "Secure document storage" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                    <feature.icon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Features */}
            <div className="bg-slate-100 rounded-2xl p-8 border-2 border-slate-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">For Tenants</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: DollarSign, text: "Easy online rent payment (FPX, e-wallet, card)" },
                  { icon: Bell, text: "Automatic payment reminders" },
                  { icon: Wrench, text: "Submit maintenance requests with photos" },
                  { icon: FileText, text: "Access lease documents anytime" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                    <feature.icon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA SECTION ===== */}
      <section className="py-20 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Reclaim Your Time?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join hundreds of Malaysian landlords who've already saved thousands of hours managing their properties with JagaSewa. Start your free trial today - no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button 
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 rounded-xl text-lg font-bold hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              Start Free 14-Day Trial
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white text-white rounded-xl text-lg font-bold hover:bg-white hover:text-blue-600 transition-all cursor-pointer"
            >
              Already have an account? Login
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-blue-100">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION (Simplified) ===== */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">About JagaSewa</h2>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto">
              A modern cloud-based property management solution designed for Malaysian landlords
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h3>
              <p className="text-slate-500">
                To save Malaysian landlords time and hassle through smart automation and intuitive design.
              </p>
            </div>

            <div className="text-center p-8 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Vision</h3>
              <p className="text-slate-500">
                To become the go-to platform for independent landlords managing 10-50 properties in Malaysia.
              </p>
            </div>

            <div className="text-center p-8 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Commitment</h3>
              <p className="text-slate-500">
                Built for Malaysians. Cloud-based, secure, and always improving.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}