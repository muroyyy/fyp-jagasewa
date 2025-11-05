import React, { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff, Camera, Mail, Phone, CreditCard, Calendar } from 'lucide-react';
import { getCurrentUser, updateUserData, logout } from '../../utils/auth';
import TenantLayout from '../../components/TenantLayout';

export default function TenantSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      fetchProfile();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/profile.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data.profile);
      } else {
        setError(data.message || 'Failed to fetch profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('An error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  if (loading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileTab 
                profile={profile} 
                setError={setError} 
                setSuccess={setSuccess}
                onProfileUpdate={fetchProfile}
              />
            )}
            {activeTab === 'security' && (
              <SecurityTab 
                setError={setError} 
                setSuccess={setSuccess}
              />
            )}
          </div>
        </div>


      </div>
    </TenantLayout>
  );
}

// Profile Tab Component
function ProfileTab({ profile, setError, setSuccess, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    ic_number: '',
    date_of_birth: ''
  });
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        ic_number: profile.ic_number || '',
        date_of_birth: profile.date_of_birth || ''
      });
      if (profile.profile_image) {
        setImagePreview(`http://localhost:8000/${profile.profile_image}`);
      }
    }
  }, [profile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const token = localStorage.getItem('session_token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('ic_number', formData.ic_number);
      formDataToSend.append('date_of_birth', formData.date_of_birth);
      
      if (profileImage) {
        formDataToSend.append('profile_image', profileImage);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/update-profile.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Profile updated successfully!');
        
        // Update localStorage with new data
        const currentUser = getCurrentUser();
        updateUserData({
          ...currentUser,
          full_name: formData.full_name,
          profile: {
            ...currentUser.profile,
            full_name: formData.full_name,
            phone: formData.phone
          }
        });

        // Refresh profile data
        onProfileUpdate();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Image */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-4xl font-bold">
                {profile?.full_name?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors">
            <Camera className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-600">Click camera icon to upload new photo (Max 10MB)</p>
      </div>

      {/* Full Name */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <User className="w-4 h-4" />
          <span>Full Name</span>
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {/* Email (Read-only) */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Mail className="w-4 h-4" />
          <span>Email Address</span>
        </label>
        <input
          type="email"
          value={profile?.email || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      {/* Phone Number */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Phone className="w-4 h-4" />
          <span>Phone Number</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="+60123456789"
        />
      </div>

      {/* IC Number (Read-only) */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <CreditCard className="w-4 h-4" />
          <span>IC Number</span>
        </label>
        <input
          type="text"
          value={formData.ic_number}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">IC number cannot be changed</p>
      </div>

      {/* Date of Birth (Read-only) */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Calendar className="w-4 h-4" />
          <span>Date of Birth</span>
        </label>
        <input
          type="date"
          value={formData.date_of_birth}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Date of birth cannot be changed</p>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
          saving
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg cursor-pointer'
        }`}
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving Changes...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </form>
  );
}

// Security Tab Component
function SecurityTab({ setError, setSuccess }) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.current_password === formData.new_password) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('session_token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/change-password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password changed successfully!');
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('An error occurred while changing your password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Password */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Lock className="w-4 h-4" />
          <span>Current Password</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.current_password}
            onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Lock className="w-4 h-4" />
          <span>New Password</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.new_password}
            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            minLength="8"
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm New Password */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
          <Lock className="w-4 h-4" />
          <span>Confirm New Password</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            minLength="8"
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-green-900 mb-2">Password Requirements:</h4>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>At least 8 characters long</li>
          <li>Must be different from current password</li>
        </ul>
      </div>

      {/* Change Password Button */}
      <button
        type="submit"
        disabled={saving}
        className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
          saving
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg cursor-pointer'
        }`}
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Changing Password...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </>
        )}
      </button>
    </form>
  );
}