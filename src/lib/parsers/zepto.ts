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

// Known multi-word brands
const KNOWN_BRANDS = [
  'the whole truth', 'too yumm', 'mother dairy', 'paper boat', 'real good',
  'act ii', 'good day', 'hide and seek', 'marie gold', 'jim jam',
  'dairy milk', 'kit kat', 'coffee bite', 'pulse candy', 'center fresh'
];

export function parseZeptoUrl(url: string): ParsedZeptoUrl | null {
  const match = url.match(ZEPTO_URL_REGEX);
  if (!match) return null;

  const [, slug, productId] = match;
  
  // Clean up the slug - remove query params
  const cleanSlug = slug.split('?')[0];
  const slugLower = cleanSlug.toLowerCase().replace(/-/g, ' ');
  
  // Extract size (usually at the end like "500 g" or "1 kg")
  const sizePattern = /(\d+)\s*(g|gm|kg|ml|l|ltr|pcs|pack|pc)(?:\s|$)/i;
  const sizeMatch = slugLower.match(sizePattern);
  const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : '';
  
  // Try to find known brands
  let brand = '';
  let name = slugLower;
  
  for (const knownBrand of KNOWN_BRANDS) {
    if (slugLower.startsWith(knownBrand)) {
      brand = knownBrand;
      name = slugLower.substring(knownBrand.length).trim();
      break;
    }
  }
  
  // If no known brand, use first word
  if (!brand) {
    const parts = slugLower.split(' ');
    brand = parts[0];
    name = parts.slice(1).join(' ');
  }
  
  // Remove size from name if present
  if (size && name.includes(size.toLowerCase())) {
    name = name.replace(size.toLowerCase(), '').trim();
  }
  
  // Clean up name - remove extra descriptors for search
  name = name
    .replace(/sweetened with \w+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    platform: 'zepto',
    productId,
    slug: cleanSlug,
    brand,
    name: name || cleanSlug.replace(/-/g, ' '),
    size,
  };
}
