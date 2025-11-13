import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Mail, User, Phone, CreditCard, Calendar } from 'lucide-react';

export default function TenantInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    ic_number: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-invitation.php?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvitation(data.data);
        } else {
          setError(data.message);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to verify invitation');
        setLoading(false);
      });
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      let digits = value.replace(/\D/g, '');
      if (!digits.startsWith('60')) {
        digits = '60' + digits;
      }
      digits = digits.slice(0, 12);
      
      let formatted = '+60';
      if (digits.length > 2) {
        formatted += digits.slice(2, 3);
      }
      if (digits.length > 3) {
        formatted += ' ' + digits.slice(3, 7);
      }
      if (digits.length > 7) {
        formatted += ' ' + digits.slice(7, 11);
      }
      
      setFormData({...formData, phone: formatted});
      return;
    }

    if (name === 'ic_number') {
      let digits = value.replace(/\D/g, '');
      let formatted = '';
      
      if (digits.length > 0) {
        formatted = digits.slice(0, 6);
      }
      if (digits.length > 6) {
        formatted += '-' + digits.slice(6, 8);
      }
      if (digits.length > 8) {
        formatted += '-' + digits.slice(8, 12);
      }
      
      setFormData({...formData, ic_number: formatted});
      return;
    }

    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/complete-tenant-registration.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token })
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration completed! Please login with your credentials.');
        navigate('/login');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Building2 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Registration</h1>
            <p className="text-gray-600 mt-2">You've been invited by {invitation?.landlord_name}</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Email:</span>
              <span>{invitation?.tenant_email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Property:</span>
              <span>{invitation?.property_name}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+601x xxxx xxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: +601x xxxx xxxx</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  IC Number
                </label>
                <input
                  type="text"
                  name="ic_number"
                  required
                  value={formData.ic_number}
                  onChange={handleInputChange}
                  placeholder="xxxxxx-xx-xxxx"
                  maxLength="14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: xxxxxx-xx-xxxx</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300'
                  }`}
                />
                {formData.confirmPassword && (
                  <p className={`text-xs mt-1 ${
                    formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Completing Registration...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
irm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Completing Registration...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
