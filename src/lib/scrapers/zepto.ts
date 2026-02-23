import { BaseScraper } from './base';
import type { Platform, PriceResult } from '@/types';

export class ZeptoScraper extends BaseScraper {
  platform: Platform = 'zepto';
  private baseUrl = 'https://www.zepto.com';
  
  async setPincode(pincode: string): Promise<void> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await this.page.waitForTimeout(3000);
    
    try {
      // Click on location selector
      const locationBtn = await this.page.$('button:has-text("Select Location")') ||
                          await this.page.$('button:has-text("Deliver to")') ||
                          await this.page.$('[class*="location"]');
      
      if (locationBtn) {
        await locationBtn.click();
        await this.page.waitForTimeout(1000);
        
        // Find pincode input
        const pincodeInput = await this.page.$('input[placeholder*="pincode"]') ||
                            await this.page.$('input[placeholder*="area"]') ||
                            await this.page.$('input[type="text"]');
        
        if (pincodeInput) {
          await pincodeInput.fill(pincode);
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.log(`[zepto] Could not set pincode ${pincode}, using default location`);
    }
  }
  
  async searchProduct(query: string): Promise<PriceResult[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    
    try {
      console.log(`[zepto] Navigating to: ${searchUrl}`);
      await this.page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await this.page.waitForTimeout(5000);
      
      const title = await this.page.title();
      console.log(`[zepto] Page loaded: ${title}`);
      
      // Extract products using page.evaluate for better control
      const products = await this.page.evaluate(() => {
        const results: Array<{
          name: string;
          price: number;
          mrp: number;
          url: string;
          imageUrl?: string;
        }> = [];
        
        // Find all product links
        const productLinks = document.querySelectorAll('a[href*="/pn/"]');
        const seenUrls = new Set<string>();
        
        productLinks.forEach((link) => {
          const href = link.getAttribute('href') || '';
          if (seenUrls.has(href) || !href.includes('/pn/')) return;
          seenUrls.add(href);
          
          // Extract product name from URL slug (most reliable)
          const slugMatch = href.match(/\/pn\/([^/]+)\//);
          if (!slugMatch) return;
          
          const slug = slugMatch[1];
          // Convert slug to readable name with proper unit handling
          // "amul-butter-500-g" -> "Amul Butter 500 G"
          // "lays-chips-50g" -> "Lays Chips 50 G" (handles attached units)
          const nameFromSlug = slug
            .split('-')
            .map(word => {
              // Measurement units that should be uppercase
              const units = ['g', 'kg', 'ml', 'l', 'mg', 'gm', 'ltr'];
              
              // Check if word is a standalone unit
              if (units.includes(word.toLowerCase())) {
                return word.toUpperCase();
              }
              
              // Check if word is number+unit without hyphen (e.g., "50g", "2l")
              const unitMatch = word.match(/^(\d+)([a-z]+)$/i);
              if (unitMatch) {
                const [, number, unit] = unitMatch;
                if (units.includes(unit.toLowerCase())) {
                  return `${number} ${unit.toUpperCase()}`;
                }
              }
              
              // Regular word - capitalize first letter
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
          
          // Try to get price from the link's parent container
          const container = link.closest('div') || link;
          const text = container.textContent || '';
          
          // Extract prices - look for ₹ followed by numbers
          const priceMatches = text.match(/₹\s*(\d+)/g) || [];
          const prices = priceMatches.map(p => parseInt(p.replace(/[₹\s]/g, '')));
          
          if (prices.length === 0) return;
          
          // Usually first price is selling price, second is MRP
          const price = Math.min(...prices);
          const mrp = Math.max(...prices);
          
          // Get image if available
          const img = link.querySelector('img');
          const imageUrl = img?.src || img?.getAttribute('data-src') || undefined;
          
          results.push({
            name: nameFromSlug,
            price,
            mrp: mrp || price,
            url: href,
            imageUrl,
          });
        });
        
        return results.slice(0, 10);
      });
      
      console.log(`[zepto] Extracted ${products.length} products`);
      
      // Convert to PriceResult format
      return products.map((p, idx) => ({
        platform: 'zepto' as Platform,
        productName: p.name,
        price: p.price,
        mrp: p.mrp,
        discount: p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : undefined,
        available: true,
        productUrl: p.url.startsWith('http') ? p.url : `${this.baseUrl}${p.url}`,
        confidence: Math.max(50, 95 - idx * 5),
        scrapedAt: new Date(),
      }));
      
    } catch (error) {
      console.error('[zepto] Search error:', error);
      return [];
    }
  }
  
  async getProductDetails(url: string): Promise<PriceResult | null> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await this.page.waitForTimeout(3000);
      
      const product = await this.page.evaluate(() => {
        // Get product name from h1 or title
        const h1 = document.querySelector('h1');
        const name = h1?.textContent?.trim() || document.title.split('|')[0].trim();
        
        // Get prices
        const text = document.body.textContent || '';
        const priceMatches = text.match(/₹\s*(\d+)/g) || [];
        const prices = priceMatches.map(p => parseInt(p.replace(/[₹\s]/g, '')));
        
        const price = prices.length > 0 ? Math.min(...prices) : 0;
        const mrp = prices.length > 1 ? Math.max(...prices) : price;
        
        return { name, price, mrp };
      });
      
      if (!product.price) return null;
      
      return {
        platform: 'zepto',
        productName: product.name,
        price: product.price,
        mrp: product.mrp,
        discount: product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : undefined,
        available: true,
        productUrl: url,
        confidence: 100,
        scrapedAt: new Date(),
      };
    } catch (error) {
      console.error('[zepto] Product details error:', error);
      return null;
    }
  }
}
