import type { Platform } from '@/types';

export interface ParsedInstamartUrl {
  platform: Platform;
  productId: string;
  slug?: string;
  brand: string;
  name: string;
  size: string;
}

const INSTAMART_URL_REGEX = /swiggy\.com\/instamart\/item\/([^?]+)/i;
const INSTAMART_SEARCH_REGEX = /swiggy\.com\/instamart\/search\?query=([^&]+)/i;

export function parseInstamartUrl(url: string): ParsedInstamartUrl | null {
  // Check if it's a direct product URL
  const productMatch = url.match(INSTAMART_URL_REGEX);
  if (productMatch) {
    const [, productId] = productMatch;
    const slug = productId;
    
    // Try to extract product info from slug
    const parts = slug.split('-');
    
    // Extract size (usually last part like "500-g" or "1-kg")
    const sizePattern = /(\d+)[-]?(g|kg|ml|l|pcs|pack|gm|pc)$/i;
    const sizeMatch = slug.match(sizePattern);
    const size = sizeMatch ? sizeMatch[0].replace('-', ' ') : '';
    
    // First part is usually brand
    const brand = parts[0] || '';
    
    // Middle parts are product name
    const nameEndIndex = sizeMatch ? slug.indexOf(sizeMatch[0]) - 1 : slug.length;
    const nameStartIndex = brand.length + 1;
    const name = nameStartIndex < nameEndIndex 
      ? slug.substring(nameStartIndex, nameEndIndex).replace(/-/g, ' ').trim()
      : slug.replace(/-/g, ' ').trim();

    return {
      platform: 'instamart',
      productId,
      slug,
      brand: brand.charAt(0).toUpperCase() + brand.slice(1),
      name: name || slug.replace(/-/g, ' '),
      size,
    };
  }
  
  // Check if it's a search URL
  const searchMatch = url.match(INSTAMART_SEARCH_REGEX);
  if (searchMatch) {
    const [, query] = searchMatch;
    const decodedQuery = decodeURIComponent(query);
    
    // Try to extract basic info from search query
    const parts = decodedQuery.split(' ');
    const sizePattern = /(\d+)(g|kg|ml|l|pcs|pack|gm|pc)/i;
    const sizeMatch = decodedQuery.match(sizePattern);
    
    return {
      platform: 'instamart',
      productId: query,
      brand: parts[0] || '',
      name: decodedQuery,
      size: sizeMatch ? sizeMatch[0] : '',
    };
  }
  
  return null;
}
