'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Users, 
  Package, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';

interface RecommendationStats {
  totalActivities: number;
  totalSimilarities: number;
  totalUserScores: number;
  recentPurchases: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdminRecommendationsPage() {
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [specificUserId, setSpecificUserId] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        showToast('Failed to fetch statistics', 'error');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Error loading statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleComputeSimilarities = async () => {
    setProcessing('similarities');
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/compute-similarities', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        setTimeout(() => fetchStats(), 2000);
      } else {
        showToast(data.message || 'Failed to compute similarities', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error computing similarities', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleComputeAllUserScores = async () => {
    setProcessing('all-users');
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/compute-all-user-scores', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        setTimeout(() => fetchStats(), 2000);
      } else {
        showToast(data.message || 'Failed to compute user scores', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error computing user scores', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleComputeSpecificUser = async () => {
    if (!specificUserId || isNaN(Number(specificUserId))) {
      showToast('Please enter a valid user ID', 'error');
      return;
    }

    setProcessing('specific-user');
    try {
      const response = await fetch(`http://localhost:8080/api/admin/recommendations/compute-user-scores/${specificUserId}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        setSpecificUserId('');
        setTimeout(() => fetchStats(), 2000);
      } else {
        showToast(data.message || 'Failed to compute user scores', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error computing user scores', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleClearAll = async () => {
    setProcessing('clear-all');
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/clear-all', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        fetchStats();
      } else {
        showToast(data.message || 'Failed to clear data', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error clearing data', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleClearSimilarities = async () => {
    setProcessing('clear-similarities');
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/clear-similarities', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        fetchStats();
      } else {
        showToast(data.message || 'Failed to clear similarities', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error clearing similarities', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleClearUserScores = async () => {
    setProcessing('clear-scores');
    try {
      const response = await fetch('http://localhost:8080/api/admin/recommendations/clear-user-scores', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message, 'success');
        fetchStats();
      } else {
        showToast(data.message || 'Failed to clear user scores', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error clearing user scores', 'error');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 border-2 bg-white shadow-lg min-w-[300px] animate-slide-in ${
              toast.type === 'success' ? 'border-green-600' : 'border-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-black uppercase tracking-wide flex-1">
              {toast.message}
            </span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-black hover:bg-gray-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold text-black uppercase tracking-wide">Recommendation System</h1>
          </div>
          <p className="text-gray-600 uppercase text-sm tracking-wide">Manage AI-powered product recommendations</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-black" />
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <button onClick={fetchStats} className="text-black hover:bg-gray-100 p-1">
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Total Activities</p>
            <p className="text-4xl font-bold text-black">
              {loading ? '...' : stats?.totalActivities.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">User interactions logged</p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-black" />
            </div>
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Product Similarities</p>
            <p className="text-4xl font-bold text-black">
              {loading ? '...' : stats?.totalSimilarities.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">Similar product pairs</p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-black" />
            </div>
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">User Scores</p>
            <p className="text-4xl font-bold text-black">
              {loading ? '...' : stats?.totalUserScores.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">Personalized recommendations</p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-black" />
            </div>
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Recent Purchases</p>
            <p className="text-4xl font-bold text-black">
              {loading ? '...' : stats?.recentPurchases.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">Last 7 days</p>
          </div>
        </div>

        {/* Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Compute Similarities */}
          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black uppercase tracking-wide">Product Similarities</h2>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Analyze product relationships</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 mb-6">
              <p className="text-sm text-black mb-3 font-bold uppercase tracking-wide">
                What it does:
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Category matching</li>
                <li>• Co-purchase patterns</li>
                <li>• User behavior analysis</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 uppercase tracking-wide">
                Run after adding new products
              </p>
            </div>

            <button
              onClick={handleComputeSimilarities}
              disabled={processing !== null}
              className="w-full py-3 px-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {processing === 'similarities' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Compute Similarities
                </>
              )}
            </button>
          </div>

          {/* Compute User Scores */}
          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black uppercase tracking-wide">User Recommendations</h2>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Build personalized suggestions</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 mb-6">
              <p className="text-sm text-black mb-3 font-bold uppercase tracking-wide">
                What it does:
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Viewing history</li>
                <li>• Purchase behavior</li>
                <li>• Similar user patterns</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 uppercase tracking-wide">
                Auto-runs every 6 hours
              </p>
            </div>

            <button
              onClick={handleComputeAllUserScores}
              disabled={processing !== null}
              className="w-full py-3 px-4 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {processing === 'all-users' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Compute All Users
                </>
              )}
            </button>
          </div>
        </div>

        {/* Specific User Computation */}
        <div className="bg-white border-2 border-black p-6 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-black">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black uppercase tracking-wide">Compute Specific User</h2>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Rebuild recommendations for one user</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              value={specificUserId}
              onChange={(e) => setSpecificUserId(e.target.value)}
              placeholder="ENTER USER ID"
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-black placeholder:text-gray-400 placeholder:text-sm focus:border-black focus:outline-none uppercase tracking-wide"
            />
            <button
              onClick={handleComputeSpecificUser}
              disabled={processing !== null || !specificUserId}
              className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {processing === 'specific-user' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Compute
                </>
              )}
            </button>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="bg-white border-2 border-red-600 p-6 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black uppercase tracking-wide">Maintenance</h2>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Clear and reset recommendation data</p>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-600 p-4 mb-6">
            <p className="text-sm text-red-800 font-bold mb-2 uppercase tracking-wide">Warning</p>
            <p className="text-sm text-red-700 uppercase tracking-wide">
              These actions delete data. Use with caution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleClearSimilarities}
              disabled={processing !== null}
              className="py-3 px-4 bg-white border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {processing === 'clear-similarities' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Clear Similarities
                </>
              )}
            </button>

            <button
              onClick={handleClearUserScores}
              disabled={processing !== null}
              className="py-3 px-4 bg-white border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {processing === 'clear-scores' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Clear User Scores
                </>
              )}
            </button>

            <button
              onClick={handleClearAll}
              disabled={processing !== null}
              className="py-3 px-4 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {processing === 'clear-all' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Clear All Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-100 border-2 border-black p-6">
          <h3 className="font-bold text-black mb-4 uppercase tracking-wide">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-black">
            <div>
              <p className="font-bold mb-3 uppercase tracking-wide">Automated Schedule:</p>
              <ul className="space-y-2">
                <li>• Product similarities: Daily at 2 AM</li>
                <li>• User scores: Every 6 hours</li>
                <li>• Activity tracking: Real-time</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-3 uppercase tracking-wide">When to Trigger:</p>
              <ul className="space-y-2">
                <li>• After adding new products</li>
                <li>• When recommendations outdated</li>
                <li>• After major promotions</li>
              </ul>
            </div>
          </div>
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