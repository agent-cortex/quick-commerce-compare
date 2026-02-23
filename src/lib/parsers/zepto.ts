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

// Known multi-word brands (sorted by length desc for longest match first)
const KNOWN_BRANDS = [
  // 3+ word brands
  'the whole truth',
  'hide and seek',
  
  // 2-word brands
  'yoga bar', 'too yumm', 'mother dairy', 'paper boat', 'real good',
  'act ii', 'good day', 'marie gold', 'jim jam', 'dairy milk', 
  'kit kat', 'coffee bite', 'pulse candy', 'center fresh', 'kwality walls',
  'red bull', 'del monte', 'coca cola', 'royal canin', 'pedigree pal',
  'whiskas cat', 'borges olive', 'figaro olive', 'saffola oats',
  'quaker oats', 'kelloggs corn', 'nestle munch', 'amul cheese',
  'britannia bourbon', 'parle g', 'sunfeast dark', 'unibic cookies',
  'cadbury dairy', 'lays chips', 'bingo mad', 'kurkure masala',
  'haldirams namkeen', 'bikaji bhujia', 'aashirvaad atta', 'pillsbury chakki',
  'fortune sunlite', 'sundrop heart', 'gemini sunflower', 'dhara mustard',
  'borges extra', 'disano extra', 'figaro extra', 'del monte ketchup',
  'kissan tomato', 'maggi hot', 'tops tomato', 'veeba mayo',
  'fun foods mayo', 'dr oetker', 'weikfield cocoa', 'hersheys cocoa',
  'mccain french', 'cornetto ice', 'magnum ice', 'baskin robbins',
  'amul ice', 'mother dairy ice', 'kwality walls cornetto', 'vadilal ice'
].sort((a, b) => b.length - a.length); // Longest first for better matching

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
    if (slugLower.startsWith(knownBrand + ' ') || slugLower.startsWith(knownBrand + '-')) {
      // Capitalize brand properly (each word)
      brand = knownBrand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      name = slugLower.substring(knownBrand.length).trim();
      break;
    }
  }
  
  // If no known brand, use first word and capitalize it
  if (!brand) {
    const parts = slugLower.split(' ');
    brand = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    name = parts.slice(1).join(' ');
  }
  
  // Capitalize name properly (title case, excluding units)
  const units = ['g', 'kg', 'ml', 'l', 'mg', 'gm', 'ltr', 'with', 'and', 'or', 'the', 'of', 'in', 'on'];
  name = name.split(' ')
    .map((word, idx) => {
      // Keep units lowercase unless at start
      if (idx > 0 && units.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
  
  // Remove size from name if present
  if (size && name.toLowerCase().includes(size.toLowerCase())) {
    name = name.replace(new RegExp(size, 'gi'), '').trim();
  }
  
  // Clean up name - remove extra descriptors but keep key product info
  name = name
    .replace(/sweetened with \w+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*-\s*/, '') // Remove leading dash
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
