import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Calendar, Receipt } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import TenantLayout from '../../components/layout/TenantLayout';
import PaymentModal from '../../components/modals/PaymentModal';

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [nextPayment, setNextPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchPayments();
      fetchPaymentStatus();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/payments.php`, {
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

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/check-payment-status.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPaymentStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchPayments();
    fetchPaymentStatus();
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
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
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
        {paymentStatus && paymentStatus.payment_options.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Make Payment - {formatAmount(paymentStatus.payment_options[0].amount)}</span>
            </button>
          </div>
        )}

        {/* Payment Status Info */}
        {paymentStatus && paymentStatus.payment_status.full_month_paid && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-semibold">✓ Current month rent is paid</p>
            <p className="text-green-600 text-sm mt-1">Period: {paymentStatus.current_period}</p>
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
                        <button 
                          onClick={() => {
                            const token = localStorage.getItem('session_token');
                            window.open(`${import.meta.env.VITE_API_URL}/api/tenant/download-receipt.php?payment_id=${payment.payment_id}&token=${token}`, '_blank');
                          }}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors cursor-pointer"
                        >
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          amount={paymentStatus?.payment_options[0]?.amount || nextPayment?.amount || 0}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </TenantLayout>
  );
}