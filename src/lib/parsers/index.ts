import { parseZeptoUrl, type ParsedZeptoUrl } from './zepto';
import { parseInstamartUrl, type ParsedInstamartUrl } from './instamart';
import { parseBlinkitUrl, type ParsedBlinkitUrl } from './blinkit';
import type { Platform } from '@/types';

export type ParsedUrl = ParsedZeptoUrl | ParsedInstamartUrl | ParsedBlinkitUrl;

export function parseProductUrl(url: string): ParsedUrl | null {
  const zeptoResult = parseZeptoUrl(url);
  if (zeptoResult) return zeptoResult;
  
  const instamartResult = parseInstamartUrl(url);
  if (instamartResult) return instamartResult;
  
  const blinkitResult = parseBlinkitUrl(url);
  if (blinkitResult) return blinkitResult;
  
  return null;
}

export function detectPlatform(url: string): Platform | null {
  if (url.includes('zepto.com')) return 'zepto';
  if (url.includes('swiggy.com/instamart')) return 'instamart';
  if (url.includes('blinkit.com')) return 'blinkit';
  return null;
}

export { parseZeptoUrl, parseInstamartUrl, parseBlinkitUrl };
