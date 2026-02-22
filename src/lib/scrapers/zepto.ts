import { BaseScraper } from './base';
import type { Platform, PriceResult } from '@/types';

export class ZeptoScraper extends BaseScraper {
  platform: Platform = 'zepto';
  private baseUrl = 'https://www.zepto.com';
  
  async setPincode(pincode: string): Promise<void> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for page to load
    await this.page.waitForTimeout(2000);
    
    // Try to find and click location widget
    try {
      const locationSelectors = [
        '[data-testid="location-widget"]',
        'button:has-text("Deliver to")',
        '[class*="location"]',
        'button:has-text("Add address")',
      ];
      
      for (const selector of locationSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(1000);
          break;
        }
      }
      
      // Try to find pincode input
      const pincodeInputSelectors = [
        'input[placeholder*="pincode"]',
        'input[placeholder*="Pincode"]',
        'input[type="text"][maxlength="6"]',
        'input[placeholder*="area"]',
      ];
      
      for (const selector of pincodeInputSelectors) {
        const input = await this.page.$(selector);
        if (input) {
          await input.fill(pincode);
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(2000);
          break;
        }
      }
    } catch (error) {
      console.log('Could not set pincode, proceeding with default location');
    }
  }
  
  async searchProduct(query: string): Promise<PriceResult[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    
    try {
      await this.page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(3000);
      
      // Try multiple selectors for product cards
      const productCardSelectors = [
        '[data-testid="product-card"]',
        '[class*="ProductCard"]',
        '[class*="product-card"]',
        'a[href*="/pn/"]',
      ];
      
      let products: PriceResult[] = [];
      
      for (const cardSelector of productCardSelectors) {
        const cards = await this.page.$$(cardSelector);
        if (cards.length > 0) {
          products = await this.extractProductsFromCards(cards.slice(0, 5));
          if (products.length > 0) break;
        }
      }
      
      // If no products found via cards, try extracting from page content
      if (products.length === 0) {
        products = await this.extractProductsFromPage();
      }
      
      return products;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
  
  private async extractProductsFromCards(cards: any[]): Promise<PriceResult[]> {
    const products: PriceResult[] = [];
    
    for (let i = 0; i < cards.length; i++) {
      try {
        const card = cards[i];
        const text = await card.textContent() || '';
        const href = await card.getAttribute('href') || await card.$eval('a', (a: Element) => a.getAttribute('href')).catch(() => '');
        
        // Extract price using regex
        const priceMatch = text.match(/₹\s*(\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1]) : 0;
        
        // Try to find MRP (crossed out price)
        const mrpMatch = text.match(/₹\s*(\d+).*₹\s*(\d+)/);
        const mrp = mrpMatch ? parseInt(mrpMatch[2]) : price;
        
        // Extract name (first substantial text)
        const name = text.split('₹')[0].trim().slice(0, 100) || 'Unknown Product';
        
        if (price > 0) {
          products.push({
            platform: 'zepto',
            productName: name,
            price,
            mrp: mrp > price ? mrp : price,
            discount: mrp > price ? Math.round((1 - price / mrp) * 100) : undefined,
            available: true,
            productUrl: href ? `${this.baseUrl}${href.startsWith('/') ? '' : '/'}${href}` : this.baseUrl,
            confidence: 90 - i * 10,
            scrapedAt: new Date(),
          });
        }
      } catch {
        continue;
      }
    }
    
    return products;
  }
  
  private async extractProductsFromPage(): Promise<PriceResult[]> {
    if (!this.page) return [];
    
    try {
      // Get all links that look like product links
      const links = await this.page.$$('a[href*="/pn/"]');
      const products: PriceResult[] = [];
      const seenUrls = new Set<string>();
      
      for (let i = 0; i < Math.min(links.length, 10); i++) {
        try {
          const link = links[i];
          const href = await link.getAttribute('href') || '';
          
          if (seenUrls.has(href)) continue;
          seenUrls.add(href);
          
          const parent = await link.$('xpath=..');
          const text = await (parent || link).textContent() || '';
          
          const priceMatch = text.match(/₹\s*(\d+)/);
          if (!priceMatch) continue;
          
          const price = parseInt(priceMatch[1]);
          const name = text.split('₹')[0].trim().slice(0, 100) || 'Product';
          
          products.push({
            platform: 'zepto',
            productName: name,
            price,
            mrp: price,
            available: true,
            productUrl: `${this.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`,
            confidence: 80 - products.length * 10,
            scrapedAt: new Date(),
          });
          
          if (products.length >= 5) break;
        } catch {
          continue;
        }
      }
      
      return products;
    } catch {
      return [];
    }
  }
  
  async getProductDetails(url: string): Promise<PriceResult | null> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      const text = await this.page.textContent('body') || '';
      
      const priceMatch = text.match(/₹\s*(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 0;
      
      const titleEl = await this.page.$('h1') || await this.page.$('[class*="title"]');
      const title = titleEl ? await titleEl.textContent() : 'Product';
      
      if (!price) return null;
      
      return {
        platform: 'zepto',
        productName: title?.trim() || 'Product',
        price,
        mrp: price,
        available: true,
        productUrl: url,
        confidence: 100,
        scrapedAt: new Date(),
      };
    } catch {
      return null;
    }
  }
}
