import { ZeptoScraper } from './zepto';
import { InstamartScraper } from './instamart';
import { BlinkitScraper } from './blinkit';
import type { Platform } from '@/types';
import { BaseScraper } from './base';

export function createScraper(platform: Platform): BaseScraper | InstamartScraper | BlinkitScraper {
  switch (platform) {
    case 'zepto':
      return new ZeptoScraper();
    case 'instamart':
      return new InstamartScraper();
    case 'blinkit':
      return new BlinkitScraper();
    default:
      throw new Error(`Scraper not implemented for ${platform}`);
  }
}

export { ZeptoScraper, InstamartScraper, BlinkitScraper };
export { BaseScraper };
