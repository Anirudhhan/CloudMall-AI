'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Plus,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

interface Admin {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: string;
  isEnable: boolean;
}

interface FormData {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function AdminAdminsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams.get('action');

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (action !== 'add') {
      fetchAdmins();
    }
  }, [action]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/users?type=2', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users || []);
      } else {
        showMessage('error', 'Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      showMessage('error', 'Error loading admins');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showMessage('error', 'Please fix all errors before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new URLSearchParams();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('mobileNumber', formData.mobileNumber);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('pincode', formData.pincode);

      const response = await fetch('http://localhost:8080/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Admin registered successfully');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          mobileNumber: '',
          password: '',
          confirmPassword: '',
          address: '',
          city: '',
          state: '',
          pincode: ''
        });

        // Redirect to admin list after 2 seconds
        setTimeout(() => {
          router.push('/admin/admins');
        }, 2000);
      } else {
        showMessage('error', data.message || 'Failed to register admin');
      }
    } catch (error) {
      console.error('Error registering admin:', error);
      showMessage('error', 'Error registering admin');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Admin Form View
  if (action === 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/admins')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Admins</span>
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Add New Admin</h1>
                <p className="text-slate-600">Register a new administrator account</p>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.name ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.email ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="admin@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.mobileNumber ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.password ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                      errors.address ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Street address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.city ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.state ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        errors.pincode ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-200 pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/admins')}
                className="flex-1 py-3 px-6 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Register Admin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
                <p className="text-slate-600">Manage administrator accounts</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/admins?action=add')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add New Admin
            </button>
          </div>
        </div>

        {/* Alert Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Administrators</p>
              <p className="text-3xl font-bold text-slate-900">
                {loading ? '...' : admins.length}
              </p>
            </div>
            <div className="p-4 bg-blue-100 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {/* Admins Grid */}
        {!loading && admins.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      admin.isEnable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {admin.isEnable ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        'Disabled'
                      )}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{admin.name}</h3>
                  <p className="text-blue-100 text-sm">ID: {admin.id}</p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm text-slate-900 font-medium truncate">{admin.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Mobile</p>
                      <p className="text-sm text-slate-900 font-medium">{admin.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {admin.city}, {admin.state}
                      </p>
                      <p className="text-xs text-slate-600">{admin.pincode}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-xs text-blue-700 font-medium">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Administrator Role
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && admins.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No administrators found</h3>
            <p className="text-slate-600 mb-6">Get started by adding your first administrator</p>
            <button
              onClick={() => router.push('/admin/admins?action=add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}