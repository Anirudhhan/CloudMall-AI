'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Star, Truck, Shield, ArrowLeft, Plus, Minus, Check, Zap } from 'lucide-react';
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

export default function ProductDetailPage() {
  const params = useParams(); 
  const productId = params.id;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProduct();
    fetchRecommendedProducts();
  }, [productId]);

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

  const fetchRecommendedProducts = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/products?pageSize=4`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching recommended products:', error);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const response = await fetch(`http://localhost:8080/api/user/cart?productId=${productId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      } else if (response.status === 401) {
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    try {
      const response = await fetch(`http://localhost:8080/api/user/cart?productId=${productId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/user/cart');
      } else if (response.status === 401) {
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Product not found</h2>
          <button 
            onClick={() => router.push('/products')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Products
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl">
              <Image
                fill
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  {discountPercentage}% OFF
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-lg">
                    Out of Stock
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
                  className={`aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedImage === idx
                      ? 'ring-4 ring-blue-500 shadow-lg'
                      : 'ring-2 ring-slate-200 hover:ring-slate-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="inline-block">
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-600 text-sm">(4.0) • 127 reviews</span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{finalPrice.toLocaleString()}
                </span>
                {discountPercentage > 0 && (
                  <span className="text-2xl text-slate-400 line-through">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-green-600 font-medium">
                  You save ₹{(originalPrice - finalPrice).toLocaleString()} ({discountPercentage}%)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-4">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-slate-700">
                <span className="font-semibold">{product.stock}</span> units available
              </span>
            </div>

            {/* Quantity Selector */}
            {inStock && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-slate-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="w-16 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-3 hover:bg-slate-50 transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                  <span className="text-slate-600 text-sm">
                    Max: {product.stock} units
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBuyNow}
                disabled={!inStock || addingToCart}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                  inStock
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transform hover:scale-105'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6" />
                  Buy Now
                </span>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                  cartAdded
                    ? 'bg-green-500 text-white'
                    : inStock
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {cartAdded ? (
                    <>
                      <Check className="w-6 h-6" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </>
                  )}
                </span>
              </button>
              <button className="p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all hover:scale-105">
                <Heart className="w-6 h-6 text-slate-600 hover:text-pink-500" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Truck className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Free Delivery</p>
                  <p className="text-sm text-slate-600">On orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-slate-900">Secure Payment</p>
                  <p className="text-sm text-slate-600">100% protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Tabs */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-3">Product Details</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Category: {product.category}</li>
                <li>• Stock: {product.stock} units</li>
                <li>• Status: {product.isActive ? 'Active' : 'Inactive'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-3">Shipping Info</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Free shipping on orders over ₹500</li>
                <li>• Delivery in 3-5 business days</li>
                <li>• Easy returns within 7 days</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-3">Payment Options</h3>
              <ul className="space-y-2 text-slate-600">
                <li>• Credit/Debit Cards</li>
                <li>• Net Banking</li>
                <li>• Cash on Delivery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 pb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">You May Also Like</h2>
                <p className="text-slate-600">Discover more amazing products curated for you</p>
              </div>
              <button 
                onClick={() => router.push('/products')}
                className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
              >
                View All
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={`/products/${item.image}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {item.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {item.discount}% OFF
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/product/${item.id}`);
                          }}
                          className="flex-1 bg-white text-slate-900 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors text-sm"
                        >
                          Quick View
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                      {item.category}
                    </div>
                    <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">(4.0)</span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-bold text-slate-900">
                        ₹{item.discountPrice?.toLocaleString() || item.price.toLocaleString()}
                      </span>
                      {item.discount > 0 && (
                        <span className="text-sm text-slate-400 line-through">
                          ₹{item.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {item.stock > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>In Stock ({item.stock} units)</span>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 font-semibold">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push('/products')}
              className="md:hidden mt-6 w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors py-3 bg-blue-50 rounded-xl"
            >
              View All Products
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}