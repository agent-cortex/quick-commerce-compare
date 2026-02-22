export type Platform = 'zepto' | 'blinkit' | 'instamart';

export interface ProductInfo {
  name: string;
  brand: string;
  size: string;
  variant?: string;
  imageUrl?: string;
}

export interface PriceResult {
  platform: Platform;
  productName: string;
  price: number;
  mrp: number;
  discount?: number;
  available: boolean;
  productUrl: string;
  confidence: number;
  scrapedAt: Date;
}

export interface ComparisonRequest {
  sourceUrl: string;
  pincode: string;
}

export interface ComparisonResult {
  sourceProduct: ProductInfo;
  results: PriceResult[];
  requestedAt: Date;
  completedAt: Date;
}

export interface ScraperConfig {
  platform: Platform;
  pincode: string;
  searchQuery: string;
  targetBrand?: string;
  targetSize?: string;
}
