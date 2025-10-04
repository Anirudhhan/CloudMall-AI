'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Phone, 
  MapPin,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface User {
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
  accountNonLocked: boolean;
  failedAttempt: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<1 | 2>(1); // 1=users, 2=admins
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [processing, setProcessing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users?type=${userType}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        showMessage('error', 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.mobileNumber.includes(query) ||
        user.city.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.isEnable);
    } else if (statusFilter === 'disabled') {
      filtered = filtered.filter(user => !user.isEnable);
    }

    setFilteredUsers(filtered);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'disable' : 'enable';
    
    if (!confirm(`Are you sure you want to ${action} this user account?`)) {
      return;
    }

    setProcessing(userId);
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/status?status=${!currentStatus}`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', data.message);
        fetchUsers();
      } else {
        showMessage('error', data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showMessage('error', 'Error updating user status');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isEnable) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Disabled
        </span>
      );
    }
    if (!user.accountNonLocked) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          <AlertCircle className="w-3 h-3" />
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          </div>
          <p className="text-slate-600">Manage user accounts and permissions</p>
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

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserType(1)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    userType === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Users
                </button>
                <button
                  onClick={() => setUserType(2)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    userType === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Admins
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, email, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="disabled">Disabled Only</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Actions</label>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{users.length}</span> {userType === 1 ? 'users' : 'admins'}
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">
                Active: {users.filter(u => u.isEnable).length}
              </span>
              <span className="text-red-600 font-medium">
                Disabled: {users.filter(u => !u.isEnable).length}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {/* Users Grid */}
        {!loading && filteredUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    {getStatusBadge(user)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
                  <p className="text-blue-100 text-sm">ID: {user.id}</p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm text-slate-900 font-medium truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Mobile</p>
                      <p className="text-sm text-slate-900 font-medium">{user.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {user.city}, {user.state}
                      </p>
                      <p className="text-xs text-slate-600">{user.pincode}</p>
                    </div>
                  </div>

                  {user.failedAttempt > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                      <p className="text-xs text-orange-700">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Failed login attempts: {user.failedAttempt}
                      </p>
                    </div>
                  )}

                  {!user.accountNonLocked && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <p className="text-xs text-red-700">
                        <XCircle className="w-3 h-3 inline mr-1" />
                        Account is locked (24 hours after 3 failed attempts)
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.isEnable)}
                    disabled={processing === user.id}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      user.isEnable
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing === user.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : user.isEnable ? (
                      <>
                        <UserX className="w-4 h-4" />
                        Disable Account
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Enable Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No users found</h3>
            <p className="text-slate-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : `No ${userType === 1 ? 'users' : 'admins'} registered yet`}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">Account Status Information</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Active
              </p>
              <p className="text-blue-700">User can login and access the platform normally.</p>
            </div>
            <div>
              <p className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Locked
              </p>
              <p className="text-blue-700">
                Account locked for 24 hours after 3 failed login attempts. Unlocks automatically.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Disabled
              </p>
              <p className="text-blue-700">
                Admin-disabled account. User cannot login until re-enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}