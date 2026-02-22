import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { Platform, PriceResult } from '@/types';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  
  abstract platform: Platform;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
  }
  
  async cleanup(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }
  
  abstract setPincode(pincode: string): Promise<void>;
  abstract searchProduct(query: string): Promise<PriceResult[]>;
  abstract getProductDetails(url: string): Promise<PriceResult | null>;
}
