"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ArrowRight, Star, TrendingUp, Zap, Shield, Truck, Award } from "lucide-react";

interface Category {
  id: number;
  name: string;
  imageName: string;
  isActive: boolean;
}

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

interface HomeData {
  categories: Category[];
  products: Product[];
}

interface UserData {
  user: any;
  cartCount: number;
  categories: Category[];
}

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData>({
    categories: [],
    products: [],
  });
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const homeResponse = await fetch(`${API_BASE}/api/home`);
      const homeData = await homeResponse.json();
      setHomeData(homeData);

      try {
        const userResponse = await fetch(`${API_BASE}/api/user-info`, {
          credentials: 'include',
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData({
            user: userData.user,
            cartCount: userData.countCart || 0,
            categories: userData.categories || [],
          });
        }
      } catch (error) {
        console.log("User not logged in");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!userData?.user) {
      router.push("/sign-in");
      return;
    }

    setAddingToCart(productId);
    try {
      const response = await fetch(`${API_BASE}/api/user/cart?productId=${productId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUserData((prev) =>
          prev ? { ...prev, cartCount: data.cartCount } : null
        );
        
        const button = document.getElementById(`cart-btn-${productId}`);
        if (button) {
          button.textContent = "Added!";
          setTimeout(() => {
            button.textContent = "Add to Cart";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const featuredProducts = homeData.products.slice(0, 8);
  const trendingProducts = homeData.products.filter(p => p.discount > 20).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">Welcome to CloudMall</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Discover Amazing Products at Unbeatable Prices
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Shop the latest trends with exclusive deals and fast delivery
            </p>
            <div className="flex gap-4">
              <Link
                href="/product"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-xl"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/product?category=smart%20phone"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-slate-50 border-y border-slate-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Free Delivery</p>
                <p className="text-sm text-slate-600">On orders over ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Secure Payment</p>
                <p className="text-sm text-slate-600">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Best Quality</p>
                <p className="text-sm text-slate-600">Premium products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Best Deals</p>
                <p className="text-sm text-slate-600">Unbeatable prices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Shop by Category</h2>
            <p className="text-lg text-slate-600">Explore our wide range of products</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {homeData.categories.map((category) => (
              <Link
                key={category.id}
                href={`/product?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-slate-50">
                    <Image
                      src={`/categories/${category.imageName}`}
                      alt={category.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                  <h2 className="text-4xl font-bold text-slate-900">Hot Deals</h2>
                </div>
                <p className="text-lg text-slate-600">Limited time offers - Don't miss out!</p>
              </div>
              <Link href="/product" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                View All
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    <Image
                      src={`/products/${product.image}`}
                      alt={product.title}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                      {product.discount}% OFF
                    </div>
                  </div>
                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600">
                        {product.title}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-slate-900">
                        ₹{product.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      id={`cart-btn-${product.id}`}
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0 || addingToCart === product.id}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {addingToCart === product.id ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Featured Products</h2>
            <p className="text-lg text-slate-600">Handpicked collection just for you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-slate-200 rounded-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  <Image
                    src={`/products/${product.image}`}
                    alt={product.title}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{product.discount}%
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    {product.category}
                  </span>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-bold text-slate-900 my-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-slate-600 ml-1">(4.0)</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{product.discountPrice.toLocaleString()}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 border-2 border-slate-200 text-slate-700 py-2 text-center rounded-lg hover:bg-slate-50 font-semibold transition-all"
                    >
                      View
                    </Link>
                    <button
                      id={`cart-btn-${product.id}`}
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0 || addingToCart === product.id}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart === product.id ? "..." : product.stock === 0 ? "Out" : "Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/product"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              View All Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">CloudMall</h3>
              <p className="text-slate-400">
                Your trusted destination for quality products at the best prices.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/product" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
                <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-blue-400 transition-colors">Facebook</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 CloudMall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}