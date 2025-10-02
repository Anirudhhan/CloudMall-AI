'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Plus, Minus, X, Check } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPrice: number;
  discount: number;
  image: string;
  stock: number;
  isActive: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ProductDetailPage() {
  const params = useParams(); 
  const productId = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      trackProductView();
      fetchSimilarProducts();
      fetchTrendingProducts();
    }
  }, [productId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/product/${productId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProductView = async () => {
    try {
      await fetch('http://localhost:8080/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: productId,
          action: 'VIEW'
        })
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackActivity = async (action: string) => {
    try {
      await fetch('http://localhost:8080/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: productId,
          action
        })
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/recommendations/similar/${productId}?limit=4`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSimilarProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/recommendations/trending?limit=4', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrendingProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    trackActivity('ADD_TO_CART');
    
    try {
      const response = await fetch(`http://localhost:8080/api/user/cart?productId=${productId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        showToast('PRODUCT ADDED TO CART', 'success');
      } else if (response.status === 401) {
        router.push('/sign-in');
      } else {
        showToast('FAILED TO ADD TO CART', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('ERROR ADDING TO CART', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    trackActivity('ADD_TO_CART');
    
    try {
      const response = await fetch(`http://localhost:8080/api/user/cart?productId=${productId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/user/cart');
      } else if (response.status === 401) {
        router.push('/sign-in');
      } else {
        showToast('FAILED TO ADD TO CART', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('ERROR ADDING TO CART', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleProductClick = (clickedProduct: Product) => {
    fetch('http://localhost:8080/api/recommendations/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        productId: clickedProduct.id.toString(),
        action: 'CLICK'
      })
    }).catch(err => console.error('Error tracking click:', err));

    router.push(`/product/${clickedProduct.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-widest">PRODUCT NOT FOUND</h2>
          <button 
            onClick={() => router.push('/product')}
            className="text-black hover:underline font-bold uppercase tracking-wider text-sm"
          >
            BACK TO PRODUCTS
          </button>
        </div>
      </div>
    );
  }

  const discountPercentage = product.discount || 0;
  const originalPrice = product.price;
  const finalPrice = product.discountPrice || product.price;
  const inStock = product.stock > 0;

  const images = [
    `/products/${product.image}`,
  ];

  const recommendedProducts = [...similarProducts];
  if (recommendedProducts.length < 4) {
    const remaining = 4 - recommendedProducts.length;
    const additionalProducts = trendingProducts
      .filter(tp => !recommendedProducts.some(sp => sp.id === tp.id))
      .filter(tp => tp.id !== product.id)
      .slice(0, remaining);
    recommendedProducts.push(...additionalProducts);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-6 py-4 shadow-lg border-2 ${
            toast.type === 'success' 
              ? 'bg-white border-black' 
              : 'bg-red-50 border-red-600'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-black" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-bold uppercase tracking-wider text-sm ${
              toast.type === 'success' ? 'text-black' : 'text-red-600'
            }`}>
              {toast.message}
            </span>
            <button onClick={() => setToast(null)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-black hover:underline transition-colors font-bold uppercase tracking-wider text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            BACK
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden bg-gray-50 border border-gray-200">
              <Image
                fill
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 font-bold text-xs uppercase tracking-wide">
                  {discountPercentage}% OFF
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-black px-6 py-3 font-bold text-lg uppercase tracking-widest">
                    OUT OF STOCK
                  </span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden transition-all border-2 ${
                    selectedImage === idx
                      ? 'border-black'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} view ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Category Badge */}
            <div className="inline-block">
              <span className="border border-black text-black px-4 py-2 text-xs font-bold uppercase tracking-widest">
                {product.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-black leading-tight uppercase tracking-wide">
              {product.title}
            </h1>

            {/* Price */}
            <div className="space-y-2 pb-8 border-b border-gray-200">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-black">
                  RS.{finalPrice.toLocaleString()}
                </span>
                {discountPercentage > 0 && (
                  <span className="text-2xl text-gray-400 line-through">
                    RS.{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-sm text-black uppercase tracking-wide">
                  SAVE RS.{(originalPrice - finalPrice).toLocaleString()} ({discountPercentage}%)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="pb-8 border-b border-gray-200">
              <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-widest">DESCRIPTION</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 bg-gray-50 p-4">
              <Check className="w-5 h-5 text-black" />
              <span className="text-black text-sm uppercase tracking-wide">
                <span className="font-bold">{product.stock}</span> UNITS AVAILABLE
              </span>
            </div>

            {/* Quantity Selector */}
            {inStock && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-black uppercase tracking-widest">QUANTITY</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border-2 border-black">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5 text-black" />
                    </button>
                    <span className="w-16 text-center font-bold text-lg text-black">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-5 h-5 text-black" />
                    </button>
                  </div>
                  <span className="text-gray-600 text-sm uppercase tracking-wide">
                    MAX: {product.stock} UNITS
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBuyNow}
                disabled={!inStock || addingToCart}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all uppercase tracking-widest ${
                  inStock
                    ? 'bg-black text-white hover:bg-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                BUY NOW
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                  inStock
                    ? 'border-2 border-black text-black hover:bg-black hover:text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {addingToCart ? 'ADDING...' : 'ADD TO CART'}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-20 bg-gray-50 p-12">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-bold text-sm text-black mb-4 uppercase tracking-widest">PRODUCT DETAILS</h3>
              <ul className="space-y-2 text-gray-700 text-sm uppercase tracking-wide">
                <li>CATEGORY: {product.category}</li>
                <li>STOCK: {product.stock} UNITS</li>
                <li>STATUS: {product.isActive ? 'ACTIVE' : 'INACTIVE'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm text-black mb-4 uppercase tracking-widest">SHIPPING INFO</h3>
              <ul className="space-y-2 text-gray-700 text-sm uppercase tracking-wide">
                <li>FREE SHIPPING OVER RS.500</li>
                <li>DELIVERY IN 3-5 DAYS</li>
                <li>7 DAYS EASY RETURNS</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm text-black mb-4 uppercase tracking-widest">PAYMENT OPTIONS</h3>
              <ul className="space-y-2 text-gray-700 text-sm uppercase tracking-wide">
                <li>CREDIT/DEBIT CARDS</li>
                <li>NET BANKING</li>
                <li>CASH ON DELIVERY</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendedProducts.length > 0 && (
          <div className="mt-20 pb-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-black mb-2 uppercase tracking-widest">
                {similarProducts.length > 0 ? 'SIMILAR PRODUCTS' : 'YOU MAY ALSO LIKE'}
              </h2>
              <div className="w-20 h-1 bg-black"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white border border-gray-200 hover:border-black transition-all duration-300 cursor-pointer"
                  onClick={() => handleProductClick(item)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={`/products/${item.image}`}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
                        {item.discount}% OFF
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                      {item.category}
                    </div>
                    <h3 className="font-bold text-black line-clamp-2 group-hover:underline uppercase text-sm tracking-wide">
                      {item.title}
                    </h3>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-bold text-black">
                        RS.{item.discountPrice?.toLocaleString() || item.price.toLocaleString()}
                      </span>
                      {item.discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          RS.{item.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {item.stock > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-black font-bold uppercase tracking-wide">
                        <Check className="w-3.5 h-3.5" />
                        <span>IN STOCK</span>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 font-bold uppercase tracking-wide">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>
                </div>
              ))}
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