import { parseZeptoUrl, type ParsedZeptoUrl } from './zepto';
import type { Platform } from '@/types';

export type ParsedUrl = ParsedZeptoUrl;

export function parseProductUrl(url: string): ParsedUrl | null {
  const zeptoResult = parseZeptoUrl(url);
  if (zeptoResult) return zeptoResult;
  
  return null;
}

export function detectPlatform(url: string): Platform | null {
  if (url.includes('zepto.com')) return 'zepto';
  if (url.includes('blinkit.com')) return 'blinkit';
  if (url.includes('swiggy.com/instamart')) return 'instamart';
  return null;
}

export { parseZeptoUrl };
