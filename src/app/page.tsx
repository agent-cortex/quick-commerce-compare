'use client';

import { useState } from 'react';
import { CompareForm } from '@/components/CompareForm';
import { ResultsTable } from '@/components/ResultsTable';
import type { ComparisonResult } from '@/types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleCompare = async (url: string, pincode: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, pincode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare prices');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 px-4 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">
            🛒 Quick Commerce Compare
          </h1>
          <p className="text-purple-100 text-lg">
            Compare prices across Zepto, Blinkit & Swiggy Instamart
          </p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* How it works */}
        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm text-gray-600">Paste product URL</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-sm text-gray-600">Enter your pincode</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm text-gray-600">Get best price</p>
          </div>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <CompareForm onSubmit={handleCompare} loading={loading} />
        </div>
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <ResultsTable result={result} />
          </div>
        )}
        
        {/* Supported Platforms */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Supported Platforms</p>
          <div className="flex justify-center gap-8 items-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl">🟣</span>
              <span className="text-sm text-gray-600 mt-1">Zepto</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl">🟡</span>
              <span className="text-sm text-gray-600 mt-1">Blinkit</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl">🟠</span>
              <span className="text-sm text-gray-600 mt-1">Instamart</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>Built with Next.js + Playwright</p>
          <p className="mt-1">Prices are fetched in real-time from platforms</p>
        </footer>
      </div>
    </main>
  );
}
