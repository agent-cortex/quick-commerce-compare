import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { Platform, PriceResult } from '@/types';

// Note: playwright-extra is not fully compatible with playwright's latest API
// We'll use regular playwright with stealth-like configurations
// If needed, we can migrate to puppeteer-extra for better stealth support

export class BlinkitScraper {
  platform: Platform = 'blinkit';
  private baseUrl = 'https://blinkit.com';
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  
  async initialize(): Promise<void> {
    // Use stealth configurations to bypass Cloudflare
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
      ],
    });
    
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
      permissions: ['geolocation'],
      geolocation: { latitude: 28.7041, longitude: 77.1025 }, // Delhi coordinates
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    this.page = await this.context.newPage();
    
    // Hide webdriver property
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Add chrome object
      (window as any).chrome = {
        runtime: {},
      };
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-IN', 'en-GB', 'en-US', 'en'],
      });
    });
  }
  
  async cleanup(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }
  
  async setPincode(pincode: string): Promise<void> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for page to load
      await this.page.waitForTimeout(3000);
      
      // Try to find and set location
      const locationSelectors = [
        'button:has-text("Detect my location")',
        'button:has-text("Change")',
        'input[placeholder*="pincode"]',
        'input[placeholder*="delivery location"]',
        '[data-testid="location-input"]',
      ];
      
      for (const selector of locationSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(1000);
          
          // Try to find pincode input after clicking
          const pincodeInputSelectors = [
            'input[placeholder*="pincode"]',
            'input[placeholder*="Pincode"]',
            'input[type="text"][maxlength="6"]',
            'input[placeholder*="delivery location"]',
          ];
          
          for (const inputSelector of pincodeInputSelectors) {
            const input = await this.page.$(inputSelector);
            if (input) {
              await input.fill(pincode);
              await this.page.waitForTimeout(1000);
              
              // Try to submit or select from suggestions
              await this.page.keyboard.press('Enter');
              await this.page.waitForTimeout(2000);
              break;
            }
          }
          break;
        }
      }
    } catch (error) {
      console.log('Could not set pincode on Blinkit (may be blocked by Cloudflare), proceeding with default location');
    }
  }
  
  async searchProduct(query: string): Promise<PriceResult[]> {
    if (!this.page) throw new Error('Scraper not initialized');
    
    const searchUrl = `${this.baseUrl}/s/?q=${encodeURIComponent(query)}`;
    
    try {
      await this.page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(3000);
      
      // Check if we hit Cloudflare
      const pageText = await this.page.textContent('body') || '';
      if (pageText.includes('Checking your browser') || pageText.includes('cloudflare')) {
        console.log('Blinkit: Hit Cloudflare protection');
        return [];
      }
      
      // Try multiple selectors for product cards
      const productCardSelectors = [
        '[data-testid="product-card"]',
        '[class*="Product__"]',
        '[class*="ProductCard"]',
        'a[href*="/prn/"]',
        '[class*="plp-product"]',
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
      console.error('Blinkit search error:', error);
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
        const allPrices = text.match(/₹\s*(\d+)/g);
        let mrp = price;
        if (allPrices && allPrices.length > 1) {
          const prices = allPrices.map((p: string) => parseInt(p.replace(/₹\s*/, '')));
          mrp = Math.max(...prices);
        }
        
        // Extract name (first substantial text before price)
        const name = text.split('₹')[0].trim().slice(0, 100) || 'Unknown Product';
        
        // Check availability
        const isAvailable = !text.toLowerCase().includes('out of stock') && 
                           !text.toLowerCase().includes('notify me');
        
        if (price > 0) {
          products.push({
            platform: 'blinkit',
            productName: name,
            price,
            mrp: mrp > price ? mrp : price,
            discount: mrp > price ? Math.round((1 - price / mrp) * 100) : undefined,
            available: isAvailable,
            productUrl: href ? (href.startsWith('http') ? href : `${this.baseUrl}${href}`) : this.baseUrl,
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
      const links = await this.page.$$('a[href*="/prn/"]');
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
          const isAvailable = !text.toLowerCase().includes('out of stock');
          
          products.push({
            platform: 'blinkit',
            productName: name,
            price,
            mrp: price,
            available: isAvailable,
            productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
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
      
      // Check for Cloudflare
      if (text.includes('Checking your browser') || text.includes('cloudflare')) {
        console.log('Blinkit: Hit Cloudflare protection on product page');
        return null;
      }
      
      const priceMatch = text.match(/₹\s*(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 0;
      
      const titleEl = await this.page.$('h1') || await this.page.$('[class*="ProductTitle"]') || await this.page.$('[class*="title"]');
      const title = titleEl ? await titleEl.textContent() : 'Product';
      
      const isAvailable = !text.toLowerCase().includes('out of stock') && !text.toLowerCase().includes('notify me');
      
      if (!price) return null;
      
      // Try to find MRP
      const allPrices = text.match(/₹\s*(\d+)/g);
      let mrp = price;
      if (allPrices && allPrices.length > 1) {
        const prices = allPrices.map((p: string) => parseInt(p.replace(/₹\s*/, '')));
        mrp = Math.max(...prices);
      }
      
      return {
        platform: 'blinkit',
        productName: title?.trim() || 'Product',
        price,
        mrp: mrp > price ? mrp : price,
        discount: mrp > price ? Math.round((1 - price / mrp) * 100) : undefined,
        available: isAvailable,
        productUrl: url,
        confidence: 100,
        scrapedAt: new Date(),
      };
    } catch {
      return null;
    }
  }
}
