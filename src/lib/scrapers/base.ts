import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import type { Platform, PriceResult } from '@/types';

// Browserbase configuration from environment
const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected sessionId: string | null = null;
  
  abstract platform: Platform;
  
  async initialize(): Promise<void> {
    if (BROWSERBASE_API_KEY && BROWSERBASE_PROJECT_ID) {
      console.log(`[${this.platform}] Using Browserbase cloud browser`);
      await this.initializeBrowserbase();
    } else {
      console.log(`[${this.platform}] Using local Playwright (no Browserbase keys)`);
      await this.initializeLocal();
    }
  }
  
  private async initializeBrowserbase(): Promise<void> {
    // Create a Browserbase session via API
    const response = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': BROWSERBASE_API_KEY!,
      },
      body: JSON.stringify({
        projectId: BROWSERBASE_PROJECT_ID,
        browserSettings: {
          fingerprint: {
            devices: ['desktop'],
            locales: ['en-IN'],
            operatingSystems: ['windows'],
          },
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Browserbase session creation failed:', error);
      throw new Error(`Failed to create Browserbase session: ${error}`);
    }
    
    const session = await response.json();
    this.sessionId = session.id;
    console.log(`[${this.platform}] Browserbase session: ${session.id}`);
    
    // Connect to the session via CDP
    this.browser = await chromium.connectOverCDP(session.connectUrl);
    
    // Get the default context
    const contexts = this.browser.contexts();
    this.context = contexts[0] || await this.browser.newContext();
    
    // Get or create page
    const pages = this.context.pages();
    this.page = pages[0] || await this.context.newPage();
  }
  
  private async initializeLocal(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
    });
    
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    this.page = await this.context.newPage();
  }
  
  async cleanup(): Promise<void> {
    try {
      await this.page?.close();
      await this.context?.close();
      await this.browser?.close();
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    
    this.page = null;
    this.context = null;
    this.browser = null;
    this.sessionId = null;
  }
  
  abstract setPincode(pincode: string): Promise<void>;
  abstract searchProduct(query: string): Promise<PriceResult[]>;
  abstract getProductDetails(url: string): Promise<PriceResult | null>;
}
