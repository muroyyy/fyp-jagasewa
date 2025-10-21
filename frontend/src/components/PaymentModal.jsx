import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PaymentModal({ amount, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Method, 2: Details, 3: Confirm, 4: Processing, 5: Success
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const paymentMethods = {
    ewallet: {
      name: 'E-Wallet',
      icon: Smartphone,
      providers: [
        { id: 'tng', name: "Touch 'n Go", logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Touch_%27n_Go_logo.svg/1650px-Touch_%27n_Go_logo.svg.png' },
        { id: 'grabpay', name: 'GrabPay', logo: 'https://www.google.com/s2/favicons?domain=grab.com&sz=128' },
        { id: 'boost', name: 'Boost', logo: 'https://www.google.com/s2/favicons?domain=myboost.com.my&sz=128' },
        { id: 'shopeepay', name: 'ShopeePay', logo: 'https://www.google.com/s2/favicons?domain=shopee.com.my&sz=128' }
      ]
    },
    fpx: {
      name: 'FPX Online Banking',
      icon: Building,
      providers: [
        { id: 'maybank', name: 'Maybank2U', logo: 'https://www.google.com/s2/favicons?domain=maybank.com.my&sz=128' },
        { id: 'cimb', name: 'CIMB Bank', logo: 'https://www.google.com/s2/favicons?domain=cimb.com.my&sz=128' },
        { id: 'public', name: 'Public Bank', logo: 'https://www.google.com/s2/favicons?domain=pbebank.com&sz=128' },
        { id: 'rhb', name: 'RHB Bank', logo: 'https://www.rhbgroup.com/-/media/Assets/Corporate-Website/Images/About-us/Brand-Promise/bp-rhb-logo.png' },
        { id: 'hong_leong', name: 'Hong Leong Bank', logo: 'https://www.google.com/s2/favicons?domain=hlb.com.my&sz=128' },
        { id: 'ambank', name: 'AmBank', logo: 'https://www.google.com/s2/favicons?domain=ambank.com.my&sz=128' }
      ]
    },
    card: {
      name: 'Debit/Credit Card',
      icon: CreditCard,
      providers: [
        { id: 'visa', name: 'Visa', logo: 'https://www.google.com/s2/favicons?domain=visa.com&sz=128' },
        { id: 'mastercard', name: 'Mastercard', logo: 'https://www.google.com/s2/favicons?domain=mastercard.com&sz=128' }
      ]
    }
  };

  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep(2);
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirm = () => {
    setStep(3);
  };

  const handlePayment = async () => {
    setStep(4);
    setProcessing(true);

    // Simulate payment processing
    setTimeout(async () => {
      // Generate mock transaction ID
      const txnId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
      setTransactionId(txnId);

      // Submit to backend
      try {
        const token = localStorage.getItem('session_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/make-payment.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: amount,
            payment_method: selectedMethod,
            payment_provider: selectedProvider?.name || 'Card',
            transaction_id: txnId
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProcessing(false);
          setStep(5);
        } else {
          alert('Payment failed: ' + data.message);
          setProcessing(false);
        }
      } catch (err) {
        console.error('Payment error:', err);
        alert('Payment failed. Please try again.');
        setProcessing(false);
      }
    }, 3000);
  };

  const handleClose = () => {
    if (step === 5) {
      onSuccess();
    } else {
      onClose();
    }
  };

  const formatAmount = (amt) => `RM ${parseFloat(amt).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 && 'Select Payment Method'}
              {step === 2 && 'Payment Details'}
              {step === 3 && 'Confirm Payment'}
              {step === 4 && 'Processing Payment'}
              {step === 5 && 'Payment Successful'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Payment Method Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-gray-900">{formatAmount(amount)}</p>
              </div>

              <div className="space-y-3">
                {Object.entries(paymentMethods).map(([key, method]) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleMethodSelect(key)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center space-x-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.providers.length} options available</p>
                      </div>
                      <div className="text-gray-400">→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Payment Details */}
          {step === 2 && selectedMethod && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(amount)}</p>
              </div>

              {/* E-Wallet / FPX - Provider Selection */}
              {(selectedMethod === 'ewallet' || selectedMethod === 'fpx') && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Select {paymentMethods[selectedMethod].name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods[selectedMethod].providers.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderSelect(provider)}
                        className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          selectedProvider?.id === provider.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                          <img 
                            src={provider.logo} 
                            alt={provider.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
                            }}
                          />
                        </div>
                        <p className="font-medium text-sm text-gray-900">{provider.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Details Form */}
              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Enter Card Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={cardDetails.number}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={cardDetails.name}
                      onChange={handleCardChange}
                      placeholder="JOHN DOE"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiry"
                        value={cardDetails.expiry}
                        onChange={handleCardChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                        maxLength="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={selectedMethod === 'card' ? !cardDetails.number || !cardDetails.name : !selectedProvider}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Confirmation
              </button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-gray-900">
                      {paymentMethods[selectedMethod].name}
                    </span>
                  </div>
                  
                  {selectedProvider && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider</span>
                      <span className="font-semibold text-gray-900">{selectedProvider.name}</span>
                    </div>
                  )}

                  {selectedMethod === 'card' && cardDetails.number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Card Number</span>
                      <span className="font-semibold text-gray-900">
                        •••• •••• •••• {cardDetails.number.slice(-4)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-green-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-gray-900">{formatAmount(amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the terms and conditions and authorize this payment transaction
                </label>
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer"
              >
                Confirm Payment - {formatAmount(amount)}
              </button>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 4 && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment...</p>
              <p className="text-sm text-gray-500 mt-2">Do not close this window</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">Your rent payment has been processed successfully</p>

              <div className="bg-gray-50 p-6 rounded-xl mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-4">Transaction Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-900">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-gray-900">{formatAmount(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-gray-900">
                      {selectedProvider?.name || paymentMethods[selectedMethod].name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-semibold text-gray-900">
                      {new Date().toLocaleString('en-MY')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => alert('Receipt download coming soon!')}
                  className="flex-1 py-3 border-2 border-green-600 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all cursor-pointer"
                >
                  Download Receipt
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}