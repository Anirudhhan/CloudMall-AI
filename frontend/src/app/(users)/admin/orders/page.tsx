'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  CheckCircle,
  X,
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

interface Toast {
  type: 'success' | 'error';
  text: string;
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
  const [toast, setToast] = useState<Toast | null>(null);
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    fetchOrderStatuses();
    fetchOrders();
  }, [currentPage]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
        showToast('error', 'FAILED TO FETCH ORDERS');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('error', 'ERROR LOADING ORDERS');
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
          showToast('error', 'ORDER NOT FOUND');
        }
      } else {
        const data = await response.json();
        showToast('error', data.message || 'ORDER NOT FOUND');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error searching order:', error);
      showToast('error', 'ERROR SEARCHING ORDER');
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

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
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
        showToast('success', data.message.toUpperCase());
        if (searchMode) {
          handleSearch();
        } else {
          fetchOrders();
        }
      } else {
        showToast('error', data.message?.toUpperCase() || 'FAILED TO UPDATE STATUS');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('error', 'ERROR UPDATING STATUS');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('received')) {
      return 'bg-gray-800 text-white';
    }
    if (statusLower.includes('packed')) {
      return 'bg-gray-600 text-white';
    }
    if (statusLower.includes('delivery')) {
      return 'bg-gray-500 text-white';
    }
    if (statusLower.includes('delivered')) {
      return 'bg-black text-white';
    }
    if (statusLower.includes('cancel')) {
      return 'bg-red-600 text-white';
    }
    return 'bg-gray-200 text-black';
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-6 py-4 shadow-lg border-2 ${
            toast.type === 'success' 
              ? 'bg-white border-black' 
              : 'bg-red-50 border-red-600'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-black" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-bold uppercase tracking-wider text-sm ${
              toast.type === 'success' ? 'text-black' : 'text-red-600'
            }`}>
              {toast.text}
            </span>
            <button onClick={() => setToast(null)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black uppercase tracking-widest mb-2">ORDER MANAGEMENT</h1>
          <div className="w-24 h-1 bg-black"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center justify-between mb-3">
              <Package className="w-8 h-8 text-black" />
              <p className="text-3xl font-bold text-black">{totalElements}</p>
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">TOTAL ORDERS</p>
          </div>

          <div className="bg-white border-2 border-yellow-400 p-6">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-gray-600" />
              <p className="text-3xl font-bold text-black">
                {orders.filter(o => o.status.toLowerCase().includes('progress')).length}
              </p>
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">IN PROGRESS</p>
          </div>

          <div className="bg-white border-2 border-green-500 p-6">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-8 h-8 text-black" />
              <p className="text-3xl font-bold text-black">
                {orders.filter(o => o.status.toLowerCase().includes('delivered')).length}
              </p>
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">DELIVERED</p>
          </div>

          <div className="bg-white border-2 border-red-600 p-6">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <p className="text-3xl font-bold text-black">
                {orders.filter(o => o.status.toLowerCase().includes('cancel')).length}
              </p>
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">CANCELLED</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border-2 border-black p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
                SEARCH BY ORDER ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="ENTER ORDER ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 border-2 text-black border-black px-4 py-3 focus:outline-none focus:border-gray-600 uppercase tracking-wide text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="px-8 py-3 bg-black text-white font-bold hover:bg-gray-900 uppercase tracking-widest text-sm"
                >
                  SEARCH
                </button>
                {searchMode && (
                  <button
                    onClick={handleClearSearch}
                    className="px-6 py-3 border-2 border-black text-black font-bold hover:bg-black hover:text-white uppercase tracking-widest text-sm"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-3 uppercase tracking-widest">
                FILTER BY STATUS
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-2 text-black border-black px-4 py-3 focus:outline-none uppercase tracking-wide text-sm font-bold"
              >
                <option value="all">ALL STATUS</option>
                {orderStatuses.map(status => (
                  <option key={status.id} value={status.name}>{status.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-200 flex items-center justify-between">
            <div className="text-sm font-bold text-black uppercase tracking-wider">
              SHOWING {filteredOrders.length} ORDERS
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 border-2 text-black border-black hover:bg-black hover:text-white font-bold uppercase tracking-wider text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        )}

        {/* Orders Table */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white border-2 border-black overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      ORDER DETAILS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      CUSTOMER
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      PRODUCT
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      AMOUNT
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-black uppercase tracking-wide text-sm">{order.orderId}</p>
                        <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          {order.paymentType}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-black text-sm">{order.user.name}</p>
                        <p className="text-xs text-gray-600">{order.user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/products/${order.product.image}`}
                            alt={order.product.title}
                            className="w-12 h-12 object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-bold text-black text-sm line-clamp-1 uppercase tracking-wide">
                              {order.product.title}
                            </p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">QTY: {order.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-black">RS.{(order.price * order.quantity).toLocaleString()}</p>
                        <p className="text-xs text-gray-600">RS.{order.price.toLocaleString()} × {order.quantity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
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
                            className="p-2 border-2 border-black hover:bg-black hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5 text-black hover:text-white" />
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
                            className="px-3 py-2 text-xs border-2 text-black border-black focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed font-bold uppercase tracking-wide"
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
              <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-wider">
                  PAGE {currentPage + 1} OF {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 font-bold uppercase tracking-wider text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    PREV
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 font-bold uppercase tracking-wider text-sm"
                  >
                    NEXT
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white border-2 border-black p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black uppercase tracking-widest mb-2">NO ORDERS FOUND</h3>
            <p className="text-gray-600 uppercase tracking-wide text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'TRY ADJUSTING YOUR SEARCH OR FILTERS'
                : 'ORDERS WILL APPEAR HERE'}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-black px-6 py-4 flex items-center justify-between border-b-2 border-black">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">ORDER DETAILS</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-white hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Order Info */}
                <div className="bg-gray-50 p-6">
                  <h3 className="font-bold text-black mb-4 uppercase tracking-widest text-sm">ORDER INFORMATION</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">ORDER ID</p>
                      <p className="font-bold text-black">{selectedOrder.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">ORDER DATE</p>
                      <p className="font-bold text-black">
                        {new Date(selectedOrder.orderDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">PAYMENT TYPE</p>
                      <p className="font-bold text-black">{selectedOrder.paymentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">STATUS</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-black mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                    <User className="w-5 h-5" />
                    CUSTOMER DETAILS
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">NAME</p>
                      <p className="font-bold text-black">{selectedOrder.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">EMAIL</p>
                      <p className="font-bold text-black">{selectedOrder.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">MOBILE</p>
                      <p className="font-bold text-black">{selectedOrder.user.mobileNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-black mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    PRODUCT DETAILS
                  </h3>
                  <div className="flex items-center gap-4 bg-gray-50 p-4">
                    <img
                      src={`/products/${selectedOrder.product.image}`}
                      alt={selectedOrder.product.title}
                      className="w-24 h-24 object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-black mb-2 uppercase tracking-wide">{selectedOrder.product.title}</p>
                      <p className="text-xs text-gray-600 mb-3 uppercase tracking-wide">{selectedOrder.product.category}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">PRICE</p>
                          <p className="font-bold text-black">RS.{selectedOrder.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">QUANTITY</p>
                          <p className="font-bold text-black">{selectedOrder.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">TOTAL</p>
                          <p className="font-bold text-black">
                            RS.{(selectedOrder.price * selectedOrder.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-bold text-black mb-4 uppercase tracking-widest text-sm flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    DELIVERY ADDRESS
                  </h3>
                  <div className="bg-gray-50 p-4 text-sm">
                    <p className="font-bold text-black mb-2 uppercase tracking-wide">
                      {selectedOrder.orderAddress.firstName} {selectedOrder.orderAddress.lastName}
                    </p>
                    <p className="text-black mb-1">{selectedOrder.orderAddress.address}</p>
                    <p className="text-black mb-3">
                      {selectedOrder.orderAddress.city}, {selectedOrder.orderAddress.state} - {selectedOrder.orderAddress.pincode}
                    </p>
                    <p className="text-gray-600 text-xs uppercase tracking-wide">
                      EMAIL: {selectedOrder.orderAddress.email}
                    </p>
                    <p className="text-gray-600 text-xs uppercase tracking-wide">
                      MOBILE: {selectedOrder.orderAddress.mobileNo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}