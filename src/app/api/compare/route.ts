import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseProductUrl, detectPlatform } from '@/lib/parsers';
import { createScraper } from '@/lib/scrapers';
import type { ComparisonResult, PriceResult, Platform } from '@/types';

const requestSchema = z.object({
  url: z.string().url(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
});

const TARGET_PLATFORMS: Platform[] = ['zepto', 'instamart', 'blinkit'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, pincode } = requestSchema.parse(body);
    
    // Parse source URL
    const parsed = parseProductUrl(url);
    const detectedPlatform = detectPlatform(url);
    
    if (!parsed && !detectedPlatform) {
      return NextResponse.json(
        { error: 'Unsupported URL format. Please use a Zepto, Blinkit, or Instamart product URL.' },
        { status: 400 }
      );
    }
    
    // Build search query
    let searchQuery: string;
    let sourceProduct = {
      name: '',
      brand: '',
      size: '',
    };
    
    if (parsed) {
      searchQuery = `${parsed.brand} ${parsed.name} ${parsed.size}`.trim();
      sourceProduct = {
        name: parsed.name,
        brand: parsed.brand,
        size: parsed.size,
      };
    } else {
      // Extract from URL slug if parser didn't work
      const urlParts = url.split('/');
      const slug = urlParts.find(p => p.includes('-') && !p.includes('.')) || '';
      searchQuery = slug.replace(/-/g, ' ');
      sourceProduct = {
        name: searchQuery,
        brand: '',
        size: '',
      };
    }
    
    const results: PriceResult[] = [];
    const requestedAt = new Date();
    
    // Scrape each target platform
    for (const platform of TARGET_PLATFORMS) {
      const scraper = createScraper(platform);
      
      try {
        console.log(`Initializing ${platform} scraper...`);
        await scraper.initialize();
        
        console.log(`Setting pincode ${pincode}...`);
        await scraper.setPincode(pincode);
        
        console.log(`Searching for: ${searchQuery}`);
        const platformResults = await scraper.searchProduct(searchQuery);
        console.log(`Found ${platformResults.length} results on ${platform}`);
        
        results.push(...platformResults);
      } catch (error) {
        console.error(`Error scraping ${platform}:`, error);
      } finally {
        await scraper.cleanup();
      }
    }
    
    // Sort by price
    results.sort((a, b) => a.price - b.price);
    
    const response: ComparisonResult = {
      sourceProduct,
      results,
      requestedAt,
      completedAt: new Date(),
    };
    
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Comparison error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
