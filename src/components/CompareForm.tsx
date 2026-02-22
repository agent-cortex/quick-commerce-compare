'use client';

import { useState } from 'react';

interface CompareFormProps {
  onSubmit: (url: string, pincode: string) => void;
  loading: boolean;
}

export function CompareForm({ onSubmit, loading }: CompareFormProps) {
  const [url, setUrl] = useState('');
  const [pincode, setPincode] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url, pincode);
  };
  
  const exampleUrls = [
    { label: 'Amul Butter 500g', url: 'https://www.zepto.com/pn/amul-pasteurised-butter/pvid/0d7bb93a-8db1-41ea-8e66-d3b2c2d39c07' },
    { label: 'Tata Salt 1kg', url: 'https://www.zepto.com/pn/tata-salt-iodised-salt/pvid/5f20c3e1-7b6a-4b50-9df8-b0a7c7e5c1d2' },
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Zepto, Blinkit, or Instamart product URL"
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          required
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Try:</span>
          {exampleUrls.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setUrl(example.url)}
              className="text-xs text-purple-600 hover:text-purple-800 underline"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Pincode
        </label>
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit pincode (e.g., 400001)"
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          required
          pattern="\d{6}"
          maxLength={6}
        />
        <p className="mt-1 text-xs text-gray-500">
          Prices may vary based on delivery location
        </p>
      </div>
      
      <button
        type="submit"
        disabled={loading || url.length === 0 || pincode.length !== 6}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg
                   hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 
                   disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Comparing prices across platforms...
          </span>
        ) : (
          '🔍 Compare Prices'
        )}
      </button>
    </form>
  );
}
