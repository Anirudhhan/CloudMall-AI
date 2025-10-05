'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Truck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  ShoppingBag
} from 'lucide-react';

interface OrderAddress {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Product {
  id: number;
  title: string;
  image: string;
  category: string;
  price: number;
  discountPrice: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
}

interface Order {
  id: number;
  orderId: string;
  orderDate: string;
  product: Product;
  price: number;
  quantity: number;
  status: string;
  paymentType: string;
  orderAddress: OrderAddress;
  user: User;
}

interface OrderStatus {
  id: number;
  name: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    fetchOrderStatuses();
    fetchOrders();
  }, [currentPage]);

  const fetchOrderStatuses = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/order-statuses', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrderStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching order statuses:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/orders?pageNo=${currentPage}&pageSize=${pageSize}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalElements(data.pagination?.totalElements || 0);
        setSearchMode(false);
      } else {
        showMessage('error', 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showMessage('error', 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/orders/search?orderId=${searchQuery.trim()}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setOrders([data.order]);
          setSearchMode(true);
          setTotalPages(1);
          setTotalElements(1);
        } else {
          setOrders([]);
          showMessage('error', 'Order not found');
        }
      } else {
        const data = await response.json();
        showMessage('error', data.message || 'Order not found');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error searching order:', error);
      showMessage('error', 'Error searching order');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchMode(false);
    setCurrentPage(0);
    fetchOrders();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateStatus = async (orderId: number, statusId: number) => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/orders/${orderId}/status?statusId=${statusId}`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok) {
        showMessage('success', data.message);
        if (searchMode) {
          handleSearch();
        } else {
          fetchOrders();
        }
      } else {
        showMessage('error', data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('error', 'Error updating order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('received')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (statusLower.includes('packed')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (statusLower.includes('delivery')) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (statusLower.includes('delivered')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (statusLower.includes('cancel')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) return <Clock className="w-4 h-4" />;
    if (statusLower.includes('packed')) return <Package className="w-4 h-4" />;
    if (statusLower.includes('delivery')) return <Truck className="w-4 h-4" />;
    if (statusLower.includes('delivered')) return <CheckCircle className="w-4 h-4" />;
    if (statusLower.includes('cancel')) return <XCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
          </div>
          <p className="text-slate-600">Track and manage customer orders</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{totalElements}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => o.status.toLowerCase().includes('progress')).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Delivered</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => o.status.toLowerCase().includes('delivered')).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Cancelled</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => o.status.toLowerCase().includes('cancel')).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by Order ID */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search by Order ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                {searchMode && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  {orderStatuses.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredOrders.length}</span> orders
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {/* Orders Table */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{order.orderId}</p>
                          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                            <CreditCard className="w-3 h-3" />
                            {order.paymentType}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{order.user.name}</p>
                          <p className="text-sm text-slate-600">{order.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/products/${order.product.image}`}
                            alt={order.product.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-slate-900 line-clamp-1">
                              {order.product.title}
                            </p>
                            <p className="text-sm text-slate-600">Qty: {order.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">₹{(order.price * order.quantity).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">₹{order.price.toLocaleString()} × {order.quantity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetails(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => {
                              const selectedStatus = orderStatuses.find(s => s.name === e.target.value);
                              if (selectedStatus && confirm(`Update order status to "${selectedStatus.name}"?`)) {
                                handleUpdateStatus(order.id, selectedStatus.id);
                              }
                            }}
                            disabled={updatingStatus === order.id}
                            className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            {orderStatuses.map(status => (
                              <option key={status.id} value={status.name}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!searchMode && totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here once customers place them'}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Order ID</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.orderId}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Order Date</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(selectedOrder.orderDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Payment Type</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.paymentType}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.user.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.user.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Mobile</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.user.mobileNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Product Details
                  </h3>
                  <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-4">
                    <img
                      src={`/products/${selectedOrder.product.image}`}
                      alt={selectedOrder.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 mb-1">{selectedOrder.product.title}</p>
                      <p className="text-sm text-slate-600 mb-2">{selectedOrder.product.category}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Price</p>
                          <p className="font-bold text-slate-900">₹{selectedOrder.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Quantity</p>
                          <p className="font-bold text-slate-900">{selectedOrder.quantity}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Total</p>
                          <p className="font-bold text-blue-600">
                            ₹{(selectedOrder.price * selectedOrder.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.orderAddress.firstName} {selectedOrder.orderAddress.lastName}
                    </p>
                    <p className="text-slate-700 mt-2">{selectedOrder.orderAddress.address}</p>
                    <p className="text-slate-700">
                      {selectedOrder.orderAddress.city}, {selectedOrder.orderAddress.state} - {selectedOrder.orderAddress.pincode}
                    </p>
                    <p className="text-slate-600 mt-2">
                      Email: {selectedOrder.orderAddress.email}
                    </p>
                    <p className="text-slate-600">
                      Mobile: {selectedOrder.orderAddress.mobileNo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}