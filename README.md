# 🛒 Quick Commerce Price Compare

Compare prices across Indian quick commerce platforms — Zepto, Blinkit, and Swiggy Instamart.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Playwright](https://img.shields.io/badge/Playwright-Chromium-green)

## Features

- 🔗 **Paste any product URL** from supported platforms
- 📍 **Pincode-based pricing** — get location-specific prices
- ⚡ **Real-time scraping** — prices fetched live from platforms
- 🏆 **Best price highlight** — instantly see the cheapest option
- 📱 **Mobile responsive** — works on all devices

## Supported Platforms

| Platform | Status |
|----------|--------|
| Zepto | ✅ Active |
| Blinkit | 🔜 Coming Soon |
| Swiggy Instamart | 🔜 Coming Soon |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/quick-commerce-compare.git
cd quick-commerce-compare

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Paste a product URL** from Zepto (other platforms coming soon)
2. **Enter your pincode** for location-specific pricing
3. **Click Compare** — the app scrapes the platforms in real-time
4. **See results** sorted by price with the best deal highlighted

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  API Route  │────▶│  Playwright │
│   Frontend  │     │  /api/compare│     │   Scraper   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   Quick     │
                                        │  Commerce   │
                                        │  Platforms  │
                                        └─────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── compare/
│   │       └── route.ts      # API endpoint
│   └── page.tsx              # Main page
├── components/
│   ├── CompareForm.tsx       # Input form
│   └── ResultsTable.tsx      # Results display
├── lib/
│   ├── parsers/
│   │   ├── index.ts
│   │   └── zepto.ts          # URL parser
│   └── scrapers/
│       ├── base.ts           # Base scraper class
│       ├── index.ts
│       └── zepto.ts          # Zepto scraper
└── types/
    └── index.ts              # TypeScript types
```

## API Reference

### POST /api/compare

Compare prices across platforms.

**Request:**
```json
{
  "url": "https://www.zepto.com/pn/amul-butter-500-g/pvid/...",
  "pincode": "400001"
}
```

**Response:**
```json
{
  "sourceProduct": {
    "name": "butter",
    "brand": "amul",
    "size": "500 g"
  },
  "results": [
    {
      "platform": "zepto",
      "productName": "Amul Butter 500g",
      "price": 295,
      "mrp": 310,
      "discount": 5,
      "available": true,
      "productUrl": "https://...",
      "confidence": 90
    }
  ],
  "requestedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:05.000Z"
}
```

## Limitations

- **Zepto only** for now — other platforms coming soon
- **Scraping may be slow** — each request takes 5-15 seconds
- **Anti-bot measures** — some platforms may block requests
- **Pincode coverage** — not all pincodes are serviceable

## Roadmap

- [ ] Add Blinkit support (with stealth measures)
- [ ] Add Swiggy Instamart support
- [ ] Add Redis queue for async scraping
- [ ] Add price history tracking
- [ ] Add price alerts
- [ ] Mobile app

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Scraping:** Playwright
- **Validation:** Zod

## License

MIT

## Disclaimer

This tool is for personal use only. It scrapes publicly available data for price comparison. We do not store or resell any data. Please use responsibly and respect the platforms' terms of service.
