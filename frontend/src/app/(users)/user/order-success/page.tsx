'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package, Truck, CreditCard, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (showConfetti) {
      // Fire confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-3 uppercase tracking-wide">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-gray-600 uppercase tracking-wide">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Confirmation Card */}
        <div className="border-2 border-black p-8 mb-6">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
              Order Confirmation
            </p>
            <p className="text-gray-500 text-sm">
              A confirmation email has been sent to your registered email address
            </p>
          </div>

          {/* What's Next Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide border-b-2 border-gray-200 pb-3">
              What Happens Next?
            </h2>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black uppercase tracking-wide mb-1">
                    Order Processing
                  </h3>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">
                    We're preparing your items for shipment
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black uppercase tracking-wide mb-1">
                    Delivery in 3-5 Days
                  </h3>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">
                    Your order will be delivered to your address
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black uppercase tracking-wide mb-1">
                    Payment on Delivery
                  </h3>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">
                    Pay when you receive your order
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 border border-gray-200 p-6 mb-8">
          <h3 className="font-bold text-black uppercase tracking-wide mb-3">
            Important Information
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-black mt-1">•</span>
              <span className="uppercase tracking-wide">
                You can track your order status from your orders page
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black mt-1">•</span>
              <span className="uppercase tracking-wide">
                Check your email for order confirmation and tracking details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-black mt-1">•</span>
              <span className="uppercase tracking-wide">
                Contact our support team if you have any questions
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/user/orders"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </Link>

          <Link
            href="/product"
            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-black hover:underline font-bold uppercase tracking-wide text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Customer Support */}
        <div className="mt-12 text-center border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
            Need Help?
          </p>
          <p className="text-black font-bold uppercase tracking-wide">
            Contact our customer support at support@ecom.com
          </p>
        </div>
      </div>
    </div>
  );
}