"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload } from "lucide-react";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
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

      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!formData.state.trim()) {
      setError("State is required");
      return false;
    }
    if (!formData.pincode.trim()) {
      setError("Pincode is required");
      return false;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      setError("Please enter a valid 6-digit pincode");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobileNumber", formData.mobileNumber);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("pincode", formData.pincode);
      
      if (profileImage) {
        formDataToSend.append("img", profileImage);
      }

      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert("Registration successful! Please login to continue.");
        router.push("/sign-in");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white border-2 border-black p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-black uppercase tracking-widest mb-3">CREATE ACCOUNT</h2>
            <p className="text-gray-600 text-sm uppercase tracking-wider">JOIN CLOUDMALL TODAY</p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-600 text-red-600 px-4 py-3 mb-6 text-sm font-bold uppercase tracking-wide flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Image */}
            <div className="text-center pb-6 border-b border-gray-200">
              <label className="block text-xs font-bold text-black mb-4 uppercase tracking-widest">PROFILE PICTURE (OPTIONAL)</label>
              <div className="flex flex-col items-center">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover mb-4 border-2 border-black"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 border-2 border-black flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="block w-full rounded text-sm text-black file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-sm file:font-bold file:bg-white file:text-black hover:file:bg-black hover:file:text-white file:uppercase file:tracking-wider"
                />
                <p className="text-xs text-gray-600 mt-2 uppercase tracking-wide">MAX SIZE: 5MB</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">FULL NAME *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                  required
                  disabled={loading}
                  placeholder="ENTER YOUR NAME"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">EMAIL ADDRESS *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border-2 rounded border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                  required
                  disabled={loading}
                  placeholder="YOUR@EMAIL.COM"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">MOBILE NUMBER *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full border-2 rounded border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                  required
                  disabled={loading}
                  placeholder="10 DIGITS"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">PASSWORD *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                  required
                  disabled={loading}
                  placeholder="MIN 6 CHARACTERS"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">CONFIRM PASSWORD *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                required
                disabled={loading}
                placeholder="RE-ENTER PASSWORD"
              />
            </div>

            {/* Address Information */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-widest">ADDRESS DETAILS</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">ADDRESS *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                    required
                    disabled={loading}
                    placeholder="FULL ADDRESS"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">CITY *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                      required
                      disabled={loading}
                      placeholder="CITY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">STATE *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                      required
                      disabled={loading}
                      placeholder="STATE"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">PINCODE *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full border-2 border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 disabled:bg-gray-100"
                      required
                      disabled={loading}
                      placeholder="6 DIGITS"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-4 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-sm uppercase tracking-widest"
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </div>

          <div className="mt-8 text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              ALREADY HAVE AN ACCOUNT?{" "}
              <a href="/sign-in" className="text-black hover:underline font-bold">
                SIGN IN
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}