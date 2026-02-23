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
    
    // Build search query - keep it simple for better results
    let searchQuery: string;
    let sourceProduct = {
      name: '',
      brand: '',
      size: '',
    };
    
    if (parsed) {
      // Create an effective search query
      // Strategy: brand + core product name (2-4 key words)
      const nameWords = parsed.name.split(' ')
        .filter(w => {
          // Filter out common filler words
          const fillers = ['with', 'and', 'or', 'the', 'of', 'in', 'on', 'for'];
          return !fillers.includes(w.toLowerCase()) && w.length > 1;
        })
        .slice(0, 4); // Take first 4 meaningful words
      
      searchQuery = `${parsed.brand} ${nameWords.join(' ')}`.trim();
      
      sourceProduct = {
        name: parsed.name,
        brand: parsed.brand,
        size: parsed.size,
      };
    } else {
      // Extract from URL slug if parser didn't work
      const urlParts = url.split('/');
      const slug = urlParts.find(p => p.includes('-') && !p.includes('.')) || '';
      // Take first 4 words from slug for simpler search
      searchQuery = slug.replace(/-/g, ' ').split(' ').slice(0, 4).join(' ');
      sourceProduct = {
        name: searchQuery,
        brand: '',
        size: '',
      };
    }
    
    console.log('Search query:', searchQuery);
    
    const results: PriceResult[] = [];
    const requestedAt = new Date();
    
    // Scrape each target platform with delays to avoid rate limiting
    for (const platform of TARGET_PLATFORMS) {
      const scraper = createScraper(platform);
      
      try {
        console.log(`Initializing ${platform} scraper...`);
        await scraper.initialize();
        
        // Add delay between scrapers to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`Setting pincode ${pincode}...`);
        await scraper.setPincode(pincode);
        
        // Another delay before search
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
