'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Shield, ChevronRight, AlertCircle, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'http://localhost:8080';

interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    image: string;
    price: number;
    discountPrice: number;
    discount: number;
    stock: number;
  };
  quantity: number;
  totalPrice: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrderPrice, setTotalOrderPrice] = useState(0);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/cart`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.carts || []);
        setTotalOrderPrice(data.totalOrderPrice || 0);
      } else if (response.status === 401) {
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, action: 'inc' | 'dec') => {
    setUpdatingItem(cartId);
    try {
      const response = await fetch(`${API_BASE}/api/user/cart/${cartId}/quantity?action=${action}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Quantity updated:', data);
        await fetchCart();
      } else {
        console.error('Failed to update quantity:', response.status);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = (cartId: number) => {
    setItemToDelete(cartId);
    setShowDeleteModal(true);
  };

  const confirmRemoveItem = async () => {
    if (itemToDelete === null) return;
    
    setUpdatingItem(itemToDelete);
    try {
      const response = await fetch(`${API_BASE}/api/user/cart/${itemToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Item removed:', data);
        setShowDeleteModal(false);
        setItemToDelete(null);
        await fetchCart();
        setToast({ message: 'ITEM REMOVED FROM CART', type: 'success' });
      } else {
        console.error('Failed to remove item:', response.status);
        setToast({ message: 'FAILED TO REMOVE ITEM', type: 'error' });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setToast({ message: 'ERROR REMOVING ITEM', type: 'error' });
    } finally {
      setUpdatingItem(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const proceedToCheckout = () => {
    router.push('/user/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 flex items-center justify-center mx-auto mb-6 md:mb-8">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-black" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 md:mb-4 uppercase tracking-wide">Your cart is empty</h2>
            <p className="text-gray-600 mb-6 md:mb-8 uppercase text-xs md:text-sm tracking-wide">
              Start shopping to add items to your cart
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors text-sm"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const discount = cartItems.reduce((sum, item) => {
    const itemDiscount = (item.product.price - item.product.discountPrice) * item.quantity;
    return sum + itemDiscount;
  }, 0);
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-white py-6 md:py-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 md:top-6 md:right-6 md:left-auto z-50 animate-slide-in">
          <div
            className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 shadow-lg border-2 ${
              toast.type === 'success'
                ? 'bg-white border-black'
                : 'bg-red-50 border-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
            )}
            <span
              className={`font-bold uppercase tracking-wider text-xs md:text-sm ${
                toast.type === 'success' ? 'text-black' : 'text-red-600'
              }`}
            >
              {toast.message}
            </span>
            <button onClick={() => setToast(null)} className="ml-auto flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-black">
            <div className="bg-black text-white px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide">Remove Item</h2>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black uppercase tracking-wide mb-2 text-sm md:text-base">
                    Are you sure?
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 uppercase tracking-wide">
                    This item will be removed from your cart. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={updatingItem !== null}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveItem}
                  disabled={updatingItem !== null}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  {updatingItem !== null ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent"></div>
                      Removing...
                    </span>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2 uppercase tracking-wide">Shopping Bag</h1>
          <p className="text-gray-600 uppercase text-xs md:text-sm tracking-wide">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 p-4 md:p-6"
              >
                <div className="flex gap-3 md:gap-6">
                  <div className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
                    <img
                      src={`/products/${item.product.image}`}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 md:gap-4 mb-2 md:mb-3">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="text-sm md:text-base font-bold text-black hover:underline uppercase tracking-wide line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingItem === item.id}
                        className="text-black hover:bg-gray-100 p-1.5 md:p-2 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mb-3 md:mb-4">
                      <span className="text-lg md:text-xl font-bold text-black">
                        RS.{item.product.discountPrice.toLocaleString()}
                      </span>
                      {item.product.discount > 0 && (
                        <>
                          <span className="text-sm md:text-base text-gray-400 line-through">
                            RS.{item.product.price.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                            {item.product.discount}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-xs md:text-sm text-gray-600 uppercase tracking-wide font-medium">Qty:</span>
                        <div className="flex items-center border border-gray-300">
                          <button
                            onClick={() => updateQuantity(item.id, 'dec')}
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                            className="p-1.5 md:p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3 md:w-4 md:h-4 text-black" />
                          </button>
                          <span className="w-10 md:w-12 text-center font-bold text-black text-sm md:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 'inc')}
                            disabled={item.quantity >= item.product.stock || updatingItem === item.id}
                            className="p-1.5 md:p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 text-black" />
                          </button>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs md:text-sm text-gray-600 mb-1 uppercase tracking-wide">Subtotal</p>
                        <p className="text-lg md:text-xl font-bold text-black">
                          RS.{item.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {item.product.stock < 10 && (
                      <div className="mt-2 md:mt-3 text-xs text-red-600 font-bold uppercase tracking-wide">
                        Only {item.product.stock} left in stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-4 md:p-6 lg:sticky lg:top-28 space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-xl font-bold text-black uppercase tracking-wide">Order Summary</h2>

              <div className="space-y-3 md:space-y-4 py-4 md:py-6 border-y border-gray-200">
                <div className="flex justify-between text-black text-sm md:text-base">
                  <span className="uppercase text-xs md:text-sm tracking-wide">Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold">RS.{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm md:text-base">
                    <span className="uppercase text-xs md:text-sm tracking-wide">Discount</span>
                    <span className="font-bold">-RS.{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-black text-sm md:text-base">
                  <span className="uppercase text-xs md:text-sm tracking-wide">Delivery</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-green-600 uppercase text-xs md:text-sm tracking-wide">Free</span>
                  ) : (
                    <span className="font-bold">RS.{deliveryFee.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-baseline text-base md:text-lg font-bold text-black">
                <span className="uppercase tracking-wide">Total</span>
                <span className="text-xl md:text-2xl">RS.{total.toLocaleString()}</span>
              </div>

              {deliveryFee > 0 && (
                <div className="bg-gray-100 p-3 md:p-4">
                  <p className="text-xs text-black uppercase tracking-wide">
                    Add RS.{(500 - subtotal).toLocaleString()} more for free delivery
                  </p>
                </div>
              )}

              <button
                onClick={proceedToCheckout}
                className="w-full py-3 md:py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                Checkout
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <Link
                href="/product"
                className="block w-full py-3 md:py-4 text-center border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors text-sm md:text-base"
              >
                Continue Shopping
              </Link>

              <div className="pt-4 md:pt-6 space-y-3 md:space-y-4 border-t border-gray-200">
                <div className="flex items-start gap-2 md:gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
                  <span>Free delivery on orders above RS.500</span>
                </div>
                <div className="flex items-start gap-2 md:gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
                  <span>100% secure payment</span>
                </div>
                <div className="flex items-start gap-2 md:gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Tag className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
                  <span>Best prices guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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