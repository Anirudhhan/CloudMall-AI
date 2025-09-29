"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: number;
  name: string;
  image_name: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch homepage data
        const homeResponse = await axios.get(`${API_BASE}/api/home`);
        setHomeData(homeResponse.data);

        // Fetch user info if logged in
        try {
          const userResponse = await axios.get(`${API_BASE}/api/user-info`, {
            withCredentials: true,
          });
          setUserData(userResponse.data);
        } catch (error) {
          // User not logged in - this is fine
          console.log("User not logged in");
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!userData?.user) {
      router.push("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/api/user/cart`,
        `productId=${productId}`,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // Update cart count in UI
        setUserData((prev) =>
          prev ? { ...prev, cartCount: response.data.cartCount } : null
        );
        alert("Product added to cart!");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-2 border-gray-300 border-t-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-medium text-black">
                CloudMall
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 border border-gray-300 text-gray-700 px-4 py-1 hover:bg-gray-50"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-black"
              >
                Products
              </Link>

              {userData?.user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/user/cart"
                    className="relative text-gray-700 hover:text-black"
                  >
                    Cart
                    {userData.cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs h-5 w-5 flex items-center justify-center">
                        {userData.cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={
                      userData.user.role === "ROLE_ADMIN"
                        ? "/admin/dashboard"
                        : "/user/dashboard"
                    }
                    className="text-gray-700 hover:text-black"
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm text-gray-600">
                    Hello, {userData.user.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-black"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="border border-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-50"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-gray-300 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-medium mb-4 text-black">Welcome to CloudMall</h1>
          <p className="text-xl mb-8 text-gray-600">
            Discover amazing products at unbeatable prices
          </p>
          <Link
            href="/products"
            className="inline-block border border-gray-300 text-gray-700 px-8 py-3 hover:bg-gray-50"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 border-b border-gray-300">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-medium text-center mb-12 text-black">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {homeData.categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group text-center"
              >
                <div className="border border-gray-300 p-6 mb-4 group-hover:bg-gray-50">
                      <Image
                        src={`/categories/cat-phones.jpeg`} // TODO: HAVE TO FIX THE CAT IMAGE
                        alt={category.name}
                        width={900}
                        height={500}
                        className="object-contain"
                      />
                </div>
                <h3 className="font-light text-gray-700 group-hover:text-black">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-medium text-center mb-12 text-black">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {homeData.products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-300 overflow-hidden hover:bg-gray-50"
              >
                <div className="relative h-48 bg-white">
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                    <Image
                      src={`/products/${product.image}`}
                      alt={product.title}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {product.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-sm">
                      -{product.discount}%
                    </span>
                  )}
                </div>

                <div className="p-4 border-t border-gray-300">
                  <h3 className="font-medium text-black mb-2 truncate">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-medium text-black">
                        ₹{product.discountPrice.toFixed(2)}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-600 line-through">
                          ₹{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 text-center hover:bg-gray-50 text-sm"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="flex-1 bg-black text-white px-3 py-2 hover:bg-gray-800 text-sm"
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/products"
              className="inline-block border border-gray-300 text-gray-700 px-8 py-3 hover:bg-gray-50"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-300">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-medium mb-4 text-black">Stay Updated</h2>
          <p className="text-xl mb-8 text-gray-600">
            Get the latest deals and new arrivals delivered to your inbox
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 focus:outline-none"
            />
            <button className="bg-black text-white px-6 py-3 hover:bg-gray-800">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-medium mb-4">CloudMall</h3>
              <p className="text-gray-400 font-light">
                Your one-stop destination for quality products at affordable
                prices.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 font-light">
                <li>
                  <Link href="/products" className="hover:text-white">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400 font-light">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-white">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-white">
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Connect With Us</h4>
              <div className="flex space-x-4 text-gray-400 font-light">
                <a href="#" className="hover:text-white">
                  Facebook
                </a>
                <a href="#" className="hover:text-white">
                  Twitter
                </a>
                <a href="#" className="hover:text-white">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 font-light">
            <p>&copy; 2024 CloudMall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}