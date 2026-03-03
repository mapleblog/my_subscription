import { NextResponse } from 'next/server';
import { ExchangeService } from '@/services/exchange';

export const runtime = 'edge';

export async function GET() {
  try {
    const rates = await ExchangeService.getRates();
    
    // Set caching headers for Edge CDN
    // s-maxage=3600: Cache on Vercel Edge for 1 hour
    // stale-while-revalidate=86400: Serve stale content for up to 24 hours while revalidating
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Exchange API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
