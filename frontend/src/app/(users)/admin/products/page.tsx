"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

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
  isActive: boolean;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    discount: "0",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const currentPage = parseInt(searchParams.get("page") || "0");
  const showAddForm = searchParams.get("action") === "add";

  useEffect(() => {
    if (showAddForm) {
      setShowForm(true);
    }
  }, [showAddForm]);

  useEffect(() => {
    fetchCategories();
    fetchProducts(currentPage, searchQuery);
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/categories/all`, {
        withCredentials: true,
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (page: number = 0, search: string = "") => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/api/admin/products?pageNo=${page}&pageSize=10&search=${search}`,
        { withCredentials: true }
      );

      setProducts(response.data.products);
      setPagination(response.data.pagination);
      setError("");
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
        setTimeout(() => router.push("/sign-in"), 2000);
      } else {
        setError("Failed to load products");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(0, searchQuery);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, GIF)");
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.category || !formData.price || !formData.stock) {
      setError("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    const discount = parseInt(formData.discount);

    if (price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (stock < 0) {
      setError("Stock cannot be negative");
      return;
    }

    if (discount < 0 || discount > 100) {
      setError("Discount must be between 0 and 100");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("discount", formData.discount);
      formDataToSend.append("isActive", formData.isActive.toString());

      if (imageFile) {
        formDataToSend.append("file", imageFile);
      }

      let response;
      if (editingProduct) {
        response = await axios.put(
          `${API_BASE}/api/admin/products/${editingProduct.id}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
      } else {
        response = await axios.post(
          `${API_BASE}/api/admin/products`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
      }

      if (response.data.success) {
        setSuccess(editingProduct ? "Product updated successfully!" : "Product created successfully!");
        resetForm();
        fetchProducts(currentPage, searchQuery);
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      setError(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (productId: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/products/${productId}`, {
        withCredentials: true,
      });

      const product = response.data.product;
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        stock: product.stock.toString(),
        discount: product.discount.toString(),
        isActive: product.isActive,
      });
      setImageFile(null);
      setImagePreview("");
      setShowForm(true);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      setError("Failed to load product details");
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/admin/products/${productId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Product deleted successfully!");
        fetchProducts(currentPage, searchQuery);
      } else {
        setError(response.data.message || "Failed to delete product");
      }
    } catch (error: any) {
      console.error("Error deleting product:", error);
      setError(error.response?.data?.message || "Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      discount: "0",
      isActive: true,
    });
    setImageFile(null);
    setImagePreview("");
    setEditingProduct(null);
    setShowForm(false);
    router.push("/admin/products");
  };

  if (loading && products.length === 0) {
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
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-black font-light">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-medium text-black">PRODUCT MANAGEMENT</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="border border-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-50 text-sm"
          >
            {showForm ? "Cancel" : "Add Product"}
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Messages */}
        {error && (
          <div className="mb-4 border border-gray-300 text-gray-700 px-4 py-3 bg-white">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 border border-gray-300 text-gray-700 px-4 py-3 bg-white">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="border border-gray-300 mb-6">
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
              />
              <button
                type="submit"
                className="border border-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-50"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchProducts(0, "");
                  }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="border border-gray-300 mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium mb-6 text-black">
                {editingProduct ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      PRODUCT TITLE *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                      placeholder="Enter product title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      CATEGORY *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                    rows={4}
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      PRICE * (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      STOCK *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      DISCOUNT (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none text-gray-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    PRODUCT IMAGE
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover border border-gray-300 mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:text-gray-700 file:bg-white hover:file:bg-gray-50"
                  />
                  <p className="text-xs text-gray-600 mt-1">Max size: 5MB (JPEG, PNG, GIF)</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-3"
                  />
                  <label htmlFor="isActive" className="text-gray-700 text-sm">
                    Active
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="border border-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    {loading ? "Saving..." : editingProduct ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="border border-gray-300">
          <div className="p-6">
            <h2 className="text-xl font-medium mb-6 text-black">ALL PRODUCTS</h2>

            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {searchQuery ? "No products found matching your search." : "No products found. Create your first product!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        TITLE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        CATEGORY
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        PRICE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        STOCK
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        STATUS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          <div className="max-w-xs truncate" title={product.title}>
                            {product.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>
                            <span className="font-medium">₹{product.discountPrice.toFixed(2)}</span>
                            {product.discount > 0 && (
                              <div className="text-xs text-gray-600 line-through">
                                ₹{product.price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs ${product.isActive ? "text-gray-700" : "text-gray-600"}`}>
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-light space-x-2">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="text-gray-700 hover:text-black"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-gray-700 hover:text-black"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-300">
                <div className="text-sm text-gray-600">
                  Showing {pagination.currentPage * pagination.pageSize + 1} to{" "}
                  {Math.min(
                    (pagination.currentPage + 1) * pagination.pageSize,
                    pagination.totalElements
                  )}{" "}
                  of {pagination.totalElements} results
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/products?page=${pagination.currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`px-3 py-1 border border-gray-300 text-sm ${
                      pagination.hasPrevious
                        ? "text-gray-700 hover:bg-gray-50"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Previous
                  </Link>
                  <span className="px-3 py-1 border border-gray-300 text-sm text-gray-700">
                    Page {pagination.currentPage + 1} of {pagination.totalPages}
                  </span>
                  <Link
                    href={`/admin/products?page=${pagination.currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`px-3 py-1 border border-gray-300 text-sm ${
                      pagination.hasNext
                        ? "text-gray-700 hover:bg-gray-50"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}