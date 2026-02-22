import { ZeptoScraper } from './zepto';
import type { Platform } from '@/types';
import { BaseScraper } from './base';

export function createScraper(platform: Platform): BaseScraper {
  switch (platform) {
    case 'zepto':
      return new ZeptoScraper();
    default:
      throw new Error(`Scraper not implemented for ${platform}`);
  }
}

export { ZeptoScraper };
export { BaseScraper };
