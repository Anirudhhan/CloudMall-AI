'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, Eye, ShoppingBag, X, MapPin, User, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'http://localhost:8080';

interface Product {
  id: number;
  title: string;
  image: string;
  price: number;
  discountPrice: number;
  category?: string;
}

interface OrderAddress {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobileNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface UserDetails {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
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
  user?: UserDetails;
}

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('progress') || statusLower.includes('processing')) {
    return <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />;
  } else if (statusLower.includes('shipped') || statusLower.includes('dispatch')) {
    return <Truck className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />;
  } else if (statusLower.includes('delivered') || statusLower.includes('success')) {
    return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />;
  } else if (statusLower.includes('cancel')) {
    return <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />;
  }
  return <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />;
};

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('progress') || statusLower.includes('processing')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (statusLower.includes('shipped') || statusLower.includes('dispatch')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (statusLower.includes('delivered') || statusLower.includes('success')) {
    return 'bg-green-50 text-green-700 border-green-200';
  } else if (statusLower.includes('cancel')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/orders`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const sortedOrders = (data.orders || []).sort((a: Order, b: Order) => {
          const dateA = new Date(a.orderDate).getTime();
          const dateB = new Date(b.orderDate).getTime();
          return dateB - dateA; 
        });
        setOrders(sortedOrders);
      } else if (response.status === 401) {
        router.push('/sign-in');
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
    setCancelError('');
  };

  const confirmCancelOrder = async () => {
    if (selectedOrderId === null) return;

    setCancellingOrder(selectedOrderId);
    setCancelError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/user/orders/${selectedOrderId}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        setShowCancelModal(false);
        await fetchOrders();
      } else {
        const data = await response.json();
        setCancelError(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrderId(null);
    setCancelError('');
    setCancellingOrder(null);
  };

  const canCancelOrder = (status: string) => {
    const statusLower = status.toLowerCase();
    return statusLower.includes('progress') || statusLower.includes('processing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-black mb-4 uppercase tracking-wide">Error Loading Orders</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 md:px-8 md:py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors text-sm md:text-base"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Package className="w-12 h-12 md:w-16 md:h-16 text-black" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 md:mb-4 uppercase tracking-wide">No Orders Yet</h2>
            <p className="text-gray-600 mb-6 md:mb-8 uppercase text-xs md:text-sm tracking-wide">
              You haven't placed any orders yet
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors text-sm md:text-base"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 md:py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2 uppercase tracking-wide">My Orders</h1>
          <p className="text-gray-600 uppercase text-xs md:text-sm tracking-wide">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-6">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Order ID</p>
                      <p className="font-bold text-black uppercase tracking-wide text-sm md:text-base">{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Order Date</p>
                      <p className="font-bold text-black text-sm md:text-base">{formatDate(order.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Payment</p>
                      <p className="font-bold text-black uppercase tracking-wide text-sm md:text-base">{order.paymentType}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 md:px-4 py-2 border ${getStatusColor(order.status)} font-bold uppercase text-xs tracking-wide self-start sm:self-auto`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 overflow-hidden mx-auto sm:mx-0">
                    <img
                      src={`/products/${order.product.image}`}
                      alt={order.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${order.product.id}`}
                      className="text-base md:text-lg font-bold text-black hover:underline uppercase tracking-wide line-clamp-2 mb-2 inline-block"
                    >
                      {order.product.title}
                    </Link>

                    <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mb-2 md:mb-3">
                      <span className="text-lg md:text-xl font-bold text-black">
                        RS.{order.price.toLocaleString()}
                      </span>
                      {order.product.price !== order.product.discountPrice && (
                        <span className="text-xs md:text-sm text-gray-400 line-through">
                          RS.{order.product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 uppercase tracking-wide">
                      Quantity: <span className="font-bold text-black">{order.quantity}</span>
                    </p>

                    {/* Delivery Address Preview */}
                    <div className="bg-gray-50 p-3 md:p-4 mb-3 md:mb-4">
                      <p className="text-xs font-bold text-black uppercase tracking-wide mb-2">Delivery Address</p>
                      <p className="text-xs md:text-sm text-gray-700">
                        {order.orderAddress.name || `${order.orderAddress.firstName} ${order.orderAddress.lastName}`}<br />
                        {order.orderAddress.address}<br />
                        {order.orderAddress.city}, {order.orderAddress.state} - {order.orderAddress.pincode}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-black text-white font-bold uppercase tracking-wide text-xs md:text-sm hover:bg-gray-900 transition-colors"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        View Details
                      </button>

                      {canCancelOrder(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrder === order.id}
                          className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 border-2 border-red-600 text-red-600 font-bold uppercase tracking-wide text-xs md:text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingOrder === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-red-600 border-t-transparent"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                              Cancel Order
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 md:mt-8 text-center">
          <Link
            href="/product"
            className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors text-sm md:text-base"
          >
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white border-0 sm:border-2 border-black w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b-2 border-black z-10">
              <h2 className="text-lg sm:text-2xl font-bold text-white uppercase tracking-wide sm:tracking-widest">ORDER DETAILS</h2>
              <button
                onClick={closeDetailsModal}
                className="text-white hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              {/* Order Info */}
              <div className="bg-gray-50 p-4 sm:p-6">
                <h3 className="font-bold text-black mb-3 sm:mb-4 uppercase tracking-wide sm:tracking-widest text-xs sm:text-sm">ORDER INFORMATION</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">ORDER ID</p>
                    <p className="font-bold text-black text-sm break-all">{selectedOrder.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">ORDER DATE</p>
                    <p className="font-bold text-black text-sm">
                      {formatDateTime(selectedOrder.orderDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">PAYMENT TYPE</p>
                    <p className="font-bold text-black text-sm">{selectedOrder.paymentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">STATUS</p>
                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-bold uppercase tracking-wide sm:tracking-wider border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-bold text-black mb-3 sm:mb-4 uppercase tracking-wide sm:tracking-widest text-xs sm:text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  PRODUCT DETAILS
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4">
                  <img
                    src={`/products/${selectedOrder.product.image}`}
                    alt={selectedOrder.product.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-gray-200 mx-auto sm:mx-0"
                  />
                  <div className="flex-1 w-full">
                    <p className="font-bold text-black mb-1 sm:mb-2 uppercase tracking-wide text-sm sm:text-base">{selectedOrder.product.title}</p>
                    {selectedOrder.product.category && (
                      <p className="text-xs text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">{selectedOrder.product.category}</p>
                    )}
                    <div className="grid grid-cols-3 gap-3 sm:gap-6 text-xs sm:text-sm">
                      <div>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">PRICE</p>
                        <p className="font-bold text-black">RS.{selectedOrder.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">QTY</p>
                        <p className="font-bold text-black">{selectedOrder.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide sm:tracking-widest mb-1">TOTAL</p>
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
                <h3 className="font-bold text-black mb-3 sm:mb-4 uppercase tracking-wide sm:tracking-widest text-xs sm:text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  DELIVERY ADDRESS
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm">
                  <p className="font-bold text-black mb-2 uppercase tracking-wide">
                    {selectedOrder.orderAddress.name || `${selectedOrder.orderAddress.firstName} ${selectedOrder.orderAddress.lastName}`}
                  </p>
                  <p className="text-black mb-1 leading-relaxed">{selectedOrder.orderAddress.address}</p>
                  <p className="text-black mb-3">
                    {selectedOrder.orderAddress.city}, {selectedOrder.orderAddress.state} - {selectedOrder.orderAddress.pincode}
                  </p>
                  {selectedOrder.orderAddress.email && (
                    <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                      EMAIL: {selectedOrder.orderAddress.email}
                    </p>
                  )}
                  <p className="text-gray-600 text-xs uppercase tracking-wide">
                    MOBILE: {selectedOrder.orderAddress.mobileNo}
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 sm:p-6">
                <h3 className="font-bold text-black mb-3 sm:mb-4 uppercase tracking-wide sm:tracking-widest text-xs sm:text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  PAYMENT SUMMARY
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-black font-bold">RS.{(selectedOrder.price * selectedOrder.quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-gray-200">
                    <span className="text-black font-bold">Total Amount</span>
                    <span className="text-black font-bold text-base sm:text-lg">RS.{(selectedOrder.price * selectedOrder.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-black">
            <div className="bg-black text-white px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide">Cancel Order</h2>
            </div>
            
            <div className="p-4 md:p-6">
              {cancelError && (
                <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 flex items-start gap-2 md:gap-3">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-red-800 font-medium">{cancelError}</p>
                </div>
              )}

              <div className="flex items-start gap-3 md:gap-4 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black uppercase tracking-wide mb-2 text-sm md:text-base">
                    Are you sure?
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 uppercase tracking-wide">
                    This action cannot be undone. Your order will be cancelled and you'll receive a confirmation email.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancellingOrder !== null}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancellingOrder !== null}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  {cancellingOrder !== null ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent"></div>
                      Cancelling...
                    </span>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}