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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-16 h-16 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wide">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 uppercase text-sm tracking-wide">
              Start shopping to add items to your cart
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors"
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2 uppercase tracking-wide">Shopping Bag</h1>
          <p className="text-gray-600 uppercase text-sm tracking-wide">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 p-6"
              >
                <div className="flex gap-6">
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
                    <img
                      src={`/products/${item.product.image}`}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-3">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="text-base font-bold text-black hover:underline uppercase tracking-wide line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updatingItem === item.id}
                        className="text-black hover:bg-gray-100 p-2 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-xl font-bold text-black">
                        RS.{item.product.discountPrice.toLocaleString()}
                      </span>
                      {item.product.discount > 0 && (
                        <>
                          <span className="text-base text-gray-400 line-through">
                            RS.{item.product.price.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                            {item.product.discount}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 uppercase tracking-wide font-medium">Qty:</span>
                        <div className="flex items-center border border-gray-300">
                          <button
                            onClick={() => updateQuantity(item.id, 'dec')}
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-black" />
                          </button>
                          <span className="w-12 text-center font-bold text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 'inc')}
                            disabled={item.quantity >= item.product.stock || updatingItem === item.id}
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-black" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Subtotal</p>
                        <p className="text-xl font-bold text-black">
                          RS.{item.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {item.product.stock < 10 && (
                      <div className="mt-3 text-xs text-red-600 font-bold uppercase tracking-wide">
                        Only {item.product.stock} left in stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 sticky top-28 space-y-6">
              <h2 className="text-xl font-bold text-black uppercase tracking-wide">Order Summary</h2>

              <div className="space-y-4 py-6 border-y border-gray-200">
                <div className="flex justify-between text-black">
                  <span className="uppercase text-sm tracking-wide">Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold">RS.{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="uppercase text-sm tracking-wide">Discount</span>
                    <span className="font-bold">-RS.{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-black">
                  <span className="uppercase text-sm tracking-wide">Delivery</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-green-600 uppercase text-sm tracking-wide">Free</span>
                  ) : (
                    <span className="font-bold">RS.{deliveryFee.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-black">
                <span className="uppercase tracking-wide">Total</span>
                <span className="text-2xl">RS.{total.toLocaleString()}</span>
              </div>

              {deliveryFee > 0 && (
                <div className="bg-gray-100 p-4">
                  <p className="text-xs text-black uppercase tracking-wide">
                    Add RS.{(500 - subtotal).toLocaleString()} more for free delivery
                  </p>
                </div>
              )}

              <button
                onClick={proceedToCheckout}
                className="w-full py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                Checkout
                <ChevronRight className="w-5 h-5" />
              </button>

              <Link
                href="/product"
                className="block w-full py-4 text-center border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Continue Shopping
              </Link>

              <div className="pt-6 space-y-4 border-t border-gray-200">
                <div className="flex items-start gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Truck className="w-5 h-5 text-black flex-shrink-0" />
                  <span>Free delivery on orders above RS.500</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Shield className="w-5 h-5 text-black flex-shrink-0" />
                  <span>100% secure payment</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-600 uppercase tracking-wide">
                  <Tag className="w-5 h-5 text-black flex-shrink-0" />
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