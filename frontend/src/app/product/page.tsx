'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, ShoppingCart, Sparkles } from 'lucide-react';

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

interface Category {
  id: number;
  name: string;
  imageName: string;
  isActive: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ProductsSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  
  const [showCategoryFilter, setShowCategoryFilter] = useState(true);
  const [showPriceFilter, setShowPriceFilter] = useState(true);
  const [showDiscountFilter, setShowDiscountFilter] = useState(true);
  const [showStockFilter, setShowStockFilter] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchRecommendations();
  }, [searchQuery, selectedCategory, currentPage]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    products.forEach(product => {
      trackActivity(product.id, 'VIEW');
    });
  }, [products]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/home', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('pageNo', currentPage.toString());
      params.append('pageSize', '12');

      const response = await fetch(`http://localhost:8080/api/products?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalElements(data.pagination?.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/recommendations/for-you?limit=6', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedProducts(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const trackActivity = async (productId: number, action: string) => {
    try {
      await fetch('http://localhost:8080/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: productId.toString(),
          action
        })
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const handleProductClick = (product: Product) => {
    trackActivity(product.id, 'CLICK');
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    trackActivity(product.id, 'ADD_TO_CART');
    
    try {
      const response = await fetch('http://localhost:8080/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams({
          productId: product.id.toString()
        })
      });

      if (response.ok) {
        setToast({ message: 'PRODUCT ADDED TO CART', type: 'success' });
      } else {
        setToast({ message: 'PLEASE LOGIN TO ADD TO CART', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToast({ message: 'ERROR ADDING TO CART', type: 'error' });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 100000 });
    setFilterPriceRange({ min: 0, max: 100000 });
    setSortBy('');
    setCurrentPage(0);
  };

  const applyPriceFilter = () => {
    setFilterPriceRange(priceRange);
  };

  const getFilteredProducts = () => {
    let filtered = [...products];

    if (filterPriceRange.min > 0 || filterPriceRange.max < 100000) {
      filtered = filtered.filter(p => {
        const price = p.discountPrice || p.price;
        return price >= filterPriceRange.min && price <= filterPriceRange.max;
      });
    }

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'discount') {
      filtered.sort((a, b) => b.discount - a.discount);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-white">
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
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-black flex-shrink-0" />
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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar Filters - Mobile Overlay */}
          {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setShowFilters(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black uppercase tracking-wide">FILTER</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2">
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterContent 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    handleCategoryChange={handleCategoryChange}
                    showCategoryFilter={showCategoryFilter}
                    setShowCategoryFilter={setShowCategoryFilter}
                    showPriceFilter={showPriceFilter}
                    setShowPriceFilter={setShowPriceFilter}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    applyPriceFilter={applyPriceFilter}
                    showDiscountFilter={showDiscountFilter}
                    setShowDiscountFilter={setShowDiscountFilter}
                    showStockFilter={showStockFilter}
                    setShowStockFilter={setShowStockFilter}
                    clearAllFilters={clearAllFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <FilterContent 
                categories={categories}
                selectedCategory={selectedCategory}
                handleCategoryChange={handleCategoryChange}
                showCategoryFilter={showCategoryFilter}
                setShowCategoryFilter={setShowCategoryFilter}
                showPriceFilter={showPriceFilter}
                setShowPriceFilter={setShowPriceFilter}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                applyPriceFilter={applyPriceFilter}
                showDiscountFilter={showDiscountFilter}
                setShowDiscountFilter={setShowDiscountFilter}
                showStockFilter={showStockFilter}
                setShowStockFilter={setShowStockFilter}
                clearAllFilters={clearAllFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Recommendations */}
            {recommendedProducts.length > 0 && (
              <div className="mb-8 md:mb-10">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black" />
                  <h2 className="text-base md:text-xl font-bold text-black uppercase tracking-wide">Recommended For You</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {recommendedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="cursor-pointer group"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100 mb-2 md:mb-3">
                        <img
                          src={`/products/${product.image}`}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-xs font-medium text-black line-clamp-1 mb-1">
                        {product.title}
                      </h3>
                      <p className="text-xs md:text-sm font-bold text-black">
                        RS.{product.discountPrice?.toLocaleString() || product.price.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide mb-1">
                  {searchQuery ? `${searchQuery}` : 'OVERSIZED T-SHIRTS'}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 uppercase tracking-wide">
                  {filteredProducts.length} PRODUCTS
                </p>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter
                </button>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-gray-600 uppercase tracking-wide hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 md:px-4 py-2 border border-gray-300 text-black text-xs md:text-sm font-medium uppercase tracking-wide focus:border-black focus:outline-none cursor-pointer"
                  >
                    <option value="">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || filterPriceRange.min > 0 || filterPriceRange.max < 100000) && (
              <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
                <span className="text-xs md:text-sm text-gray-600 uppercase tracking-wide">Filters:</span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-2 px-2 md:px-3 py-1 bg-black text-white text-xs uppercase tracking-wide">
                    {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedCategory('')}
                    />
                  </span>
                )}
                {(filterPriceRange.min > 0 || filterPriceRange.max < 100000) && (
                  <span className="inline-flex items-center gap-2 px-2 md:px-3 py-1 bg-black text-white text-xs uppercase tracking-wide">
                    RS.{filterPriceRange.min} - RS.{filterPriceRange.max}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setPriceRange({ min: 0, max: 100000 });
                        setFilterPriceRange({ min: 0, max: 100000 });
                      }}
                    />
                  </span>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20 md:py-32">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent"></div>
              </div>
            )}

            {/* Products Grid */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100 mb-3 md:mb-4">
                      <img
                        src={`/products/${product.image}`}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wide">
                          {product.discount}% OFF
                        </div>
                      )}
                      <button 
                        className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-black" />
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-bold text-black uppercase text-xs md:text-sm tracking-wide line-clamp-2 group-hover:underline">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-baseline gap-1.5 md:gap-2">
                        <span className="text-sm md:text-lg font-bold text-black">
                          RS.{product.discountPrice?.toLocaleString() || product.price.toLocaleString()}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-xs md:text-sm text-gray-400 line-through">
                            RS.{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Products */}
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20 md:py-32">
                <h3 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide mb-3">No products found</h3>
                <p className="text-sm md:text-base text-gray-600 mb-6">
                  Try adjusting your filters
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 md:px-8 py-2.5 md:py-3 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 text-sm md:text-base"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 md:mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 md:px-6 py-2 border border-gray-300 text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="flex gap-1 md:gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm font-bold uppercase ${
                          currentPage === pageNum
                            ? 'bg-black text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 md:px-6 py-2 border border-gray-300 text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </main>
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

// Filter Content Component (used in both mobile and desktop)
function FilterContent({ 
  categories, selectedCategory, handleCategoryChange,
  showCategoryFilter, setShowCategoryFilter,
  showPriceFilter, setShowPriceFilter,
  priceRange, setPriceRange, applyPriceFilter,
  showDiscountFilter, setShowDiscountFilter,
  showStockFilter, setShowStockFilter,
  clearAllFilters
}: any) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base md:text-lg font-bold text-black uppercase tracking-wide lg:block hidden">FILTER</h2>
        <button
          onClick={clearAllFilters}
          className="text-xs md:text-sm text-gray-600 hover:text-black font-medium uppercase tracking-wide"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-200">
        <button
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h3 className="font-bold text-black uppercase text-xs md:text-sm tracking-wide">Category</h3>
          {showCategoryFilter ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {showCategoryFilter && (
          <div className="space-y-2 md:space-y-3">
            {categories.map((cat: Category) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 md:gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedCategory === cat.name}
                  onChange={() => handleCategoryChange(cat.name)}
                  className="w-4 h-4 border-2 border-gray-300 rounded-sm text-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs md:text-sm text-gray-700 group-hover:text-black uppercase tracking-wide">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-200">
        <button
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h3 className="font-bold text-black uppercase text-xs md:text-sm tracking-wide">Price Range</h3>
          {showPriceFilter ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {showPriceFilter && (
          <div className="space-y-3 md:space-y-4">
            <div className="flex gap-2 md:gap-3">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-full px-2 md:px-3 py-2 border border-gray-300 text-black text-xs md:text-sm focus:border-black focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-full px-2 md:px-3 py-2 border border-gray-300 text-black text-xs md:text-sm focus:border-black focus:outline-none"
              />
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full py-2 md:py-2.5 bg-black text-white font-bold text-xs md:text-sm uppercase tracking-wide hover:bg-gray-900 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Discount Filter */}
      <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-200">
        <button
          onClick={() => setShowDiscountFilter(!showDiscountFilter)}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h3 className="font-bold text-black uppercase text-xs md:text-sm tracking-wide">Discount</h3>
          {showDiscountFilter ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {showDiscountFilter && (
          <div className="space-y-2 md:space-y-3">
            {['10% or more', '20% or more', '30% or more', '50% or more'].map((discount) => (
              <label key={discount} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-2 border-gray-300 rounded-sm text-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs md:text-sm text-gray-700 group-hover:text-black uppercase tracking-wide">
                  {discount}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Stock Filter */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => setShowStockFilter(!showStockFilter)}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h3 className="font-bold text-black uppercase text-xs md:text-sm tracking-wide">Availability</h3>
          {showStockFilter ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
        {showStockFilter && (
          <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 border-2 border-gray-300 rounded-sm text-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs md:text-sm text-gray-700 group-hover:text-black uppercase tracking-wide">
                In Stock
              </span>
            </label>
            <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 border-2 border-gray-300 rounded-sm text-black focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs md:text-sm text-gray-700 group-hover:text-black uppercase tracking-wide">
                Include Out of Stock
              </span>
            </label>
          </div>
        )}
      </div>
    </>
  );
}