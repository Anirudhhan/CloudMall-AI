"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("cartCount", data.cartCount.toString());
        }

        if (data.user.role === "ROLE_ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white px-4">
      <div className="bg-white border-2 border-black w-full max-w-md p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-black tracking-widest uppercase mb-3">CLOUDMALL</h1>
          <p className="text-gray-600 text-sm uppercase tracking-wider">SIGN IN TO YOUR ACCOUNT</p>
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
          <div>
            <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">EMAIL</label>
            <input
              type="email"
              className="w-full border-2 rounded border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 transition disabled:bg-gray-100 disabled:border-gray-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-2 uppercase tracking-widest">PASSWORD</label>
            <input
              type="password"
              className="w-full border-2 rounded border-black text-black px-4 py-3 focus:outline-none focus:border-gray-600 transition disabled:bg-gray-100 disabled:border-gray-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-4 font-bold hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </div>

        <div className="mt-8 text-center space-y-3 pt-8 border-t border-gray-200">
          <a href="/forgot-password" className="block text-sm text-black hover:underline font-bold uppercase tracking-wider">
            FORGOT PASSWORD?
          </a>
          <p className="text-sm text-gray-600 uppercase tracking-wide">
            DON'T HAVE AN ACCOUNT?{" "}
            <a href="/sign-up" className="text-black font-bold hover:underline">
              SIGN UP
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}