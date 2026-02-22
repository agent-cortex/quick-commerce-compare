import type { Platform } from '@/types';

export interface ParsedInstamartUrl {
  platform: Platform;
  productId: string;
  slug: string;
  brand: string;
  name: string;
  size: string;
}

const INSTAMART_URL_REGEX = /swiggy\.com\/instamart\/item\/([^?]+)/i;

export function parseInstamartUrl(url: string): ParsedInstamartUrl | null {
  const match = url.match(INSTAMART_URL_REGEX);
  if (!match) return null;

  const [, slug] = match;
  const parts = slug.split('-');
  
  // Extract size (usually last part like "500-g" or "1-kg")
  const sizePattern = /(\d+)[-]?(g|kg|ml|l|pcs|pack|gm)$/i;
  const sizeMatch = slug.match(sizePattern);
  const size = sizeMatch ? sizeMatch[0].replace('-', ' ') : '';
  
  // First part is usually brand
  const brand = parts[0];
  
  // Middle parts are product name
  const nameEndIndex = sizeMatch ? slug.indexOf(sizeMatch[0]) - 1 : slug.length;
  const nameStartIndex = brand.length + 1;
  const name = nameStartIndex < nameEndIndex 
    ? slug.substring(nameStartIndex, nameEndIndex).replace(/-/g, ' ').trim()
    : slug.replace(/-/g, ' ').trim();

  // Product ID is usually the last segment after the slug or embedded in the URL
  const productId = slug;

  return {
    platform: 'instamart',
    productId,
    slug,
    brand,
    name: name || slug.replace(/-/g, ' '),
    size,
  };
}
