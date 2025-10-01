'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Shield, ChevronRight } from 'lucide-react';
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

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrderPrice, setTotalOrderPrice] = useState(0);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

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

  const removeItem = async (cartId: number) => {
    if (!confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }
    
    setUpdatingItem(cartId);
    try {
      const response = await fetch(`${API_BASE}/api/user/cart/${cartId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Item removed:', data);
        await fetchCart();
      } else {
        console.error('Failed to remove item:', response.status);
        alert('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Error removing item from cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  const proceedToCheckout = () => {
    router.push('/user/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-8 text-lg">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5" />
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
          <p className="text-slate-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-6">
                  <div className="w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={`/products/${item.product.image}`}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-2">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updatingItem === item.id}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-slate-900">
                        ₹{item.product.discountPrice.toLocaleString()}
                      </span>
                      {item.product.discount > 0 && (
                        <>
                          <span className="text-lg text-slate-400 line-through">
                            ₹{item.product.price.toLocaleString()}
                          </span>
                          <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {item.product.discount}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 font-medium">Quantity:</span>
                        <div className="flex items-center bg-slate-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, 'dec')}
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                            className="p-2 hover:bg-slate-200 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-slate-700" />
                          </button>
                          <span className="w-12 text-center font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 'inc')}
                            disabled={item.quantity >= item.product.stock || updatingItem === item.id}
                            className="p-2 hover:bg-slate-200 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Subtotal</p>
                        <p className="text-xl font-bold text-slate-900">
                          ₹{item.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {item.product.stock < 10 && (
                      <div className="mt-3 text-sm text-orange-600 font-medium">
                        Only {item.product.stock} left in stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

              <div className="space-y-3 py-4 border-y border-slate-200">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    <span className="font-semibold">₹{deliveryFee.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-2xl">₹{total.toLocaleString()}</span>
              </div>

              {deliveryFee > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Add items worth ₹{(500 - subtotal).toLocaleString()} more to get FREE delivery!
                  </p>
                </div>
              )}

              <button
                onClick={proceedToCheckout}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ChevronRight className="w-5 h-5" />
              </button>

              <Link
                href="/product"
                className="block w-full py-3 text-center border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Continue Shopping
              </Link>

              <div className="pt-4 space-y-3 border-t border-slate-200">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Free delivery on orders above ₹500</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>100% secure payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Tag className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <span>Best prices guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}