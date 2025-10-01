'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Star, ShoppingCart, Heart, Check } from 'lucide-react';

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

export default function ProductsSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
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
  
  const [showCategoryFilter, setShowCategoryFilter] = useState(true);
  const [showPriceFilter, setShowPriceFilter] = useState(true);
  const [showDiscountFilter, setShowDiscountFilter] = useState(true);
  const [showStockFilter, setShowStockFilter] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchQuery, selectedCategory, currentPage]);

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

      console.log(response);
      
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

  const handleSearchClick = () => {
    setCurrentPage(0);
    fetchProducts();
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="font-semibold text-slate-900">Category</h3>
                  {showCategoryFilter ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>
                {showCategoryFilter && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategory === cat.name}
                          onChange={() => handleCategoryChange(cat.name)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => setShowPriceFilter(!showPriceFilter)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="font-semibold text-slate-900">Price Range</h3>
                  {showPriceFilter ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>
                {showPriceFilter && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <button
                      onClick={applyPriceFilter}
                      className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => setShowDiscountFilter(!showDiscountFilter)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="font-semibold text-slate-900">Discount</h3>
                  {showDiscountFilter ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>
                {showDiscountFilter && (
                  <div className="space-y-2">
                    {['10% or more', '20% or more', '30% or more', '50% or more'].map((discount) => (
                      <label key={discount} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 text-sm">{discount}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => setShowStockFilter(!showStockFilter)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="font-semibold text-slate-900">Availability</h3>
                  {showStockFilter ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>
                {showStockFilter && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 text-sm">In Stock</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 text-sm">Include Out of Stock</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-slate-900">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Showing {filteredProducts.length} of {totalElements} products
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Filters</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="discount">Discount</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {(selectedCategory || filterPriceRange.min > 0 || filterPriceRange.max < 100000) && (
              <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Active Filters:</span>
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {selectedCategory}
                      <X
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => setSelectedCategory('')}
                      />
                    </span>
                  )}
                  {(filterPriceRange.min > 0 || filterPriceRange.max < 100000) && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      ₹{filterPriceRange.min} - ₹{filterPriceRange.max}
                      <X
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => {
                          setPriceRange({ min: 0, max: 100000 });
                          setFilterPriceRange({ min: 0, max: 100000 });
                        }}
                      />
                    </span>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={`/products/${product.image}`}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          {product.discount}% OFF
                        </div>
                      )}
                      <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-50">
                        <Heart className="w-5 h-5 text-slate-600" />
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <button className="w-full bg-white text-slate-900 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-2">
                      <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                        {product.category}
                      </div>
                      <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-1">(4.0)</span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-xl font-bold text-slate-900">
                          ₹{product.discountPrice?.toLocaleString() || product.price.toLocaleString()}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-sm text-slate-400 line-through">
                            ₹{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {product.stock > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check className="w-4 h-4" />
                          <span>In Stock</span>
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
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 hover:bg-slate-50'
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
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}