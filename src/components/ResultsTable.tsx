'use client';

import type { ComparisonResult } from '@/types';

interface ResultsTableProps {
  result: ComparisonResult;
}

const PLATFORM_STYLES = {
  zepto: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: '🟣',
  },
  blinkit: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: '🟡',
  },
  instamart: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: '🟠',
  },
};

export function ResultsTable({ result }: ResultsTableProps) {
  const { sourceProduct, results, requestedAt, completedAt } = result;
  
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
        <p className="text-gray-500">
          Try a different product or check if the pincode is serviceable.
        </p>
      </div>
    );
  }
  
  const lowestPrice = Math.min(...results.map(r => r.price));
  const timeTaken = new Date(completedAt).getTime() - new Date(requestedAt).getTime();
  
  return (
    <div className="space-y-6">
      {/* Search Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Searching for</p>
            <h3 className="font-semibold text-gray-800">
              {sourceProduct.brand && <span className="capitalize">{sourceProduct.brand} </span>}
              <span className="capitalize">{sourceProduct.name} </span>
              {sourceProduct.size && <span className="text-gray-600">{sourceProduct.size}</span>}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Found</p>
            <p className="font-semibold text-purple-600">{results.length} results</p>
            <p className="text-xs text-gray-400">{(timeTaken / 1000).toFixed(1)}s</p>
          </div>
        </div>
      </div>
      
      {/* Best Price Highlight */}
      {results.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="text-sm text-green-700">Best Price</p>
              <p className="text-2xl font-bold text-green-800">₹{lowestPrice}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${PLATFORM_STYLES[results[0].platform].bg} ${PLATFORM_STYLES[results[0].platform].text}`}>
                {PLATFORM_STYLES[results[0].platform].icon} {results[0].platform}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Results Cards */}
      <div className="space-y-3">
        {results.map((r, idx) => {
          const style = PLATFORM_STYLES[r.platform];
          const isBest = r.price === lowestPrice;
          
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                isBest ? 'border-green-300 bg-green-50/50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Platform Badge */}
                <div className={`px-3 py-2 rounded-lg ${style.bg} ${style.text} font-medium text-sm min-w-[100px] text-center`}>
                  {style.icon} {r.platform}
                </div>
                
                {/* Product Name */}
                <div className="flex-1 min-w-0">
                  <a
                    href={r.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-purple-600 font-medium line-clamp-2 transition-colors"
                  >
                    {r.productName}
                  </a>
                  {r.confidence < 100 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Match confidence: {r.confidence}%
                    </p>
                  )}
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${isBest ? 'text-green-600' : 'text-gray-800'}`}>
                      ₹{r.price}
                    </span>
                    {isBest && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                        LOWEST
                      </span>
                    )}
                  </div>
                  {r.mrp > r.price && (
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span className="text-sm text-gray-400 line-through">₹{r.mrp}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {r.discount}% off
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        Prices are fetched in real-time and may change. Click on a product to view on the platform.
      </p>
    </div>
  );
}
