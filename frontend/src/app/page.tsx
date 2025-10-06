"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ArrowRight, Check, X } from "lucide-react";

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

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData>({
    categories: [],
    products: [],
  });
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchData = async () => {
    try {
      const homeResponse = await fetch(`${API_BASE}/api/home`);
      const homeData = await homeResponse.json();
      setHomeData(homeData);

      try {
        const userResponse = await fetch(`${API_BASE}/api/user-info`, {
          credentials: "include",
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleAddToCart = async (productId: number) => {
    if (!userData?.user) {
      router.push("/sign-in");
      return;
    }

    setAddingToCart(productId);
    try {
      const response = await fetch(
        `${API_BASE}/api/user/cart?productId=${productId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserData((prev) =>
          prev ? { ...prev, cartCount: data.cartCount } : null
        );
        showToast("PRODUCT ADDED TO CART", "success");
      } else {
        showToast("FAILED TO ADD TO CART", "error");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("ERROR ADDING TO CART", "error");
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  const featuredProducts = homeData.products.slice(0, 8);
  const trendingProducts = homeData.products
    .filter((p) => p.discount > 20)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 md:top-6 md:right-6 md:left-auto z-50 animate-slide-in">
          <div
            className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 shadow-lg border-2 ${
              toast.type === "success"
                ? "bg-white border-black"
                : "bg-red-50 border-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
            )}
            <span
              className={`font-bold uppercase tracking-wider text-xs md:text-sm ${
                toast.type === "success" ? "text-black" : "text-red-600"
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

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center bg-no-repeat text-white py-32 md:py-48 lg:py-72 overflow-hidden"
        style={{ backgroundImage: 'url("/banner.webp")' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-center md:justify-end">
            <div className="max-w-lg text-center md:text-left text-white">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">CLOUDMALL.</h1>
              <p className="text-base md:text-lg mb-4 md:mb-6">Functional. Modular. 2k25</p>
              <a
                href="/product"
                className="inline-flex items-center gap-2 bg-white text-black px-4 md:px-2 py-3 md:py-2 font-bold hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs md:text-sm"
              >
                Shop Now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-3 uppercase tracking-widest">
              SHOP BY CATEGORY
            </h2>
            <div className="w-16 md:w-20 h-1 bg-black mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            {homeData.categories.map((category) => (
              <Link
                key={category.id}
                href={`/product?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="bg-white border border-gray-200 p-3 md:p-4 lg:p-6 hover:border-black transition-all duration-300">
                  <div className="aspect-square relative mb-2 md:mb-3 lg:mb-4 overflow-hidden bg-gray-50">
                    <Image
                      src={`/categories/${category.imageName}`}
                      alt={category.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-black text-center uppercase tracking-wide text-xs md:text-sm group-hover:underline">
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
        <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 lg:mb-16 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black uppercase tracking-widest">
                  HOT DEALS
                </h2>
                <div className="w-16 md:w-20 h-1 bg-black mt-3"></div>
              </div>
              <Link
                href="/product"
                className="text-black hover:underline font-bold flex items-center gap-2 uppercase tracking-wider text-xs md:text-sm"
              >
                VIEW ALL
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
              {trendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white border border-gray-200 hover:border-black transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={`/products/${product.image}`}
                      alt={product.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-600 text-white px-2 py-1 md:px-3 font-bold text-xs uppercase tracking-wide">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-black mb-2 md:mb-3 line-clamp-2 hover:underline uppercase text-xs md:text-sm tracking-wide">
                        {product.title}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mb-3 md:mb-4">
                      <span className="text-lg md:text-xl font-bold text-black">
                        RS.{product.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        RS.{product.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={
                        product.stock === 0 || addingToCart === product.id
                      }
                      className="w-full bg-black text-white py-2.5 md:py-3 font-bold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                      {addingToCart === product.id
                        ? "ADDING..."
                        : product.stock === 0
                        ? "OUT OF STOCK"
                        : "ADD TO CART"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-3 uppercase tracking-widest">
              FEATURED PRODUCTS
            </h2>
            <div className="w-16 md:w-20 h-1 bg-black mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 hover:border-black transition-all duration-300"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Image
                    src={`/products/${product.image}`}
                    alt={product.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-600 text-white px-2 py-1 md:px-3 text-xs font-bold uppercase tracking-wide">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-4">
                  <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                    {product.category}
                  </span>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-bold text-black my-2 line-clamp-2 hover:underline uppercase text-xs md:text-sm tracking-wide">
                      {product.title}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 mb-3 md:mb-4">
                    <span className="text-lg md:text-xl font-bold text-black">
                      RS.{product.discountPrice.toLocaleString()}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        RS.{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 border-2 border-black text-black py-2 text-center hover:bg-black hover:text-white font-bold transition-all uppercase tracking-wider text-xs"
                    >
                      VIEW
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={
                        product.stock === 0 || addingToCart === product.id
                      }
                      className="flex-1 bg-black text-white py-2 hover:bg-gray-900 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
                    >
                      {addingToCart === product.id
                        ? "..."
                        : product.stock === 0
                        ? "OUT"
                        : "CART"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 md:mt-12 lg:mt-16">
            <Link
              href="/product"
              className="inline-flex items-center gap-2 md:gap-3 bg-black text-white px-6 md:px-8 lg:px-10 py-3 md:py-4 font-bold hover:bg-gray-900 transition-all uppercase tracking-widest text-xs md:text-sm"
            >
              VIEW ALL PRODUCTS
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-10 md:py-12 lg:py-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-10 lg:mb-12">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 uppercase tracking-widest">
                CLOUDMALL
              </h3>
              <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wide">
                Premium Shopping Destination
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase tracking-wider text-xs md:text-sm">
                QUICK LINKS
              </h4>
              <ul className="space-y-2 text-gray-400 text-xs md:text-sm">
                <li>
                  <Link
                    href="/product"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase tracking-wider text-xs md:text-sm">
                SUPPORT
              </h4>
              <ul className="space-y-2 text-gray-400 text-xs md:text-sm">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/returns"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Shipping
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 uppercase tracking-wider text-xs md:text-sm">
                CONNECT
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 text-xs md:text-sm">
                <a
                  href="#"
                  className="hover:text-gray-400 transition-colors uppercase tracking-wide"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="hover:text-gray-400 transition-colors uppercase tracking-wide"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="hover:text-gray-400 transition-colors uppercase tracking-wide"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-gray-400 text-xs md:text-sm uppercase tracking-wide">
            <p>&copy; 2025 CLOUDMALL. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

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