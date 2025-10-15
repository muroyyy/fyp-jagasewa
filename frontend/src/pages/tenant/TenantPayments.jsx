import React, { useState, useEffect } from 'react';
import { Home, DollarSign, Wrench, FileText, Bell, Settings, LogOut, Menu, X, CreditCard, Calendar, Receipt } from 'lucide-react';
import { getCurrentUser, logout } from '../../utils/auth';
import PaymentModal from '../../components/PaymentModal';

export default function TenantPayments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [nextPayment, setNextPayment] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchPayments();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch('http://localhost:8000/api/tenant/payments.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPayments(data.data.payments || []);
        setNextPayment(data.data.next_payment || null);
      } else {
        setError(data.message || 'Failed to fetch payments data');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('An error occurred while loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchPayments(); // Refresh payment history
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount) => {
    return `RM ${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3 ml-2 lg:ml-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  JagaSewa
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.profile?.full_name || 'Tenant'}</p>
                  <p className="text-xs text-gray-500">Tenant Account</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.profile?.full_name?.charAt(0) || 'T'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-20">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <a href="/tenant-dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="/tenant/payments" className="flex items-center space-x-3 px-4 py-3 text-green-600 bg-green-50 rounded-lg font-medium">
              <CreditCard className="w-5 h-5" />
              <span>Payments</span>
            </a>
            <a href="/tenant/maintenance" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Wrench className="w-5 h-5" />
              <span>Maintenance</span>
            </a>
            <a href="/tenant/documents" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5" />
              <span>Documents</span>
            </a>
            <a href="/tenant/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg font-medium cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
            <p className="text-gray-600">Manage your rent payments and view history</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {nextPayment ? formatAmount(nextPayment.amount) : 'RM 0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {nextPayment ? `Due: ${formatDate(nextPayment.due_date)}` : 'No payment due'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment History</p>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Make Payment Button */}
          {nextPayment && (
            <div className="mb-8">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Make Payment - {formatAmount(nextPayment.amount)}</span>
              </button>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(payment.payment_date)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{formatAmount(payment.amount)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{payment.payment_provider || payment.payment_method}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 font-mono">{payment.transaction_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors cursor-pointer">
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history yet</h3>
                        <p className="text-gray-600">Your payment transactions will appear here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && nextPayment && (
        <PaymentModal
          amount={nextPayment.amount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}