'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, Eye, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'http://localhost:8080';

interface Product {
  id: number;
  title: string;
  image: string;
  price: number;
  discountPrice: number;
}

interface OrderAddress {
  name: string;
  mobileNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
}

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('progress') || statusLower.includes('processing')) {
    return <Clock className="w-5 h-5 text-blue-600" />;
  } else if (statusLower.includes('shipped') || statusLower.includes('dispatch')) {
    return <Truck className="w-5 h-5 text-purple-600" />;
  } else if (statusLower.includes('delivered') || statusLower.includes('success')) {
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  } else if (statusLower.includes('cancel')) {
    return <XCircle className="w-5 h-5 text-red-600" />;
  }
  return <Package className="w-5 h-5 text-gray-600" />;
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState('');

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
        setOrders(data.orders || []);
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
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">Error Loading Orders</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors"
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
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center mx-auto mb-8">
              <Package className="w-16 h-16 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wide">No Orders Yet</h2>
            <p className="text-gray-600 mb-8 uppercase text-sm tracking-wide">
              You haven't placed any orders yet
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2 uppercase tracking-wide">My Orders</h1>
          <p className="text-gray-600 uppercase text-sm tracking-wide">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </p>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Order ID</p>
                      <p className="font-bold text-black uppercase tracking-wide">{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Order Date</p>
                      <p className="font-bold text-black">{formatDate(order.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Payment</p>
                      <p className="font-bold text-black uppercase tracking-wide">{order.paymentType}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-4 py-2 border ${getStatusColor(order.status)} font-bold uppercase text-xs tracking-wide`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
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
                      className="text-lg font-bold text-black hover:underline uppercase tracking-wide line-clamp-2 mb-2 inline-block"
                    >
                      {order.product.title}
                    </Link>

                    <div className="flex flex-wrap items-baseline gap-3 mb-3">
                      <span className="text-xl font-bold text-black">
                        RS.{order.price.toLocaleString()}
                      </span>
                      {order.product.price !== order.product.discountPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          RS.{order.product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 uppercase tracking-wide">
                      Quantity: <span className="font-bold text-black">{order.quantity}</span>
                    </p>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 p-4 mb-4">
                      <p className="text-xs font-bold text-black uppercase tracking-wide mb-2">Delivery Address</p>
                      <p className="text-sm text-gray-700">
                        {order.orderAddress.name}<br />
                        {order.orderAddress.address}<br />
                        {order.orderAddress.city}, {order.orderAddress.state} - {order.orderAddress.pincode}<br />
                        Phone: {order.orderAddress.mobileNo}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/user/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase tracking-wide text-sm hover:bg-gray-900 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>

                      {canCancelOrder(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrder === order.id}
                          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-red-600 text-red-600 font-bold uppercase tracking-wide text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingOrder === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
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

        <div className="mt-8 text-center">
          <Link
            href="/product"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-black">
            <div className="bg-black text-white px-6 py-4">
              <h2 className="text-xl font-bold uppercase tracking-wide">Cancel Order</h2>
            </div>
            
            <div className="p-6">
              {cancelError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{cancelError}</p>
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black uppercase tracking-wide mb-2">
                    Are you sure?
                  </h3>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">
                    This action cannot be undone. Your order will be cancelled and you'll receive a confirmation email.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancellingOrder !== null}
                  className="flex-1 px-6 py-3 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancellingOrder !== null}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingOrder !== null ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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