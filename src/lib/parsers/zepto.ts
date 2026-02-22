import type { Platform } from '@/types';

export interface ParsedZeptoUrl {
  platform: Platform;
  productId: string;
  slug: string;
  brand: string;
  name: string;
  size: string;
}

const ZEPTO_URL_REGEX = /zepto\.com\/pn\/([^/]+)\/pvid\/([a-f0-9-]+)/i;

export function parseZeptoUrl(url: string): ParsedZeptoUrl | null {
  const match = url.match(ZEPTO_URL_REGEX);
  if (!match) return null;

  const [, slug, productId] = match;
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

  return {
    platform: 'zepto',
    productId,
    slug,
    brand,
    name: name || slug.replace(/-/g, ' '),
    size,
  };
}
