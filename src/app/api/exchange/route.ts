import { NextResponse } from 'next/server';
import { ExchangeService } from '@/services/exchange';

export const runtime = 'edge';

export async function GET() {
  try {
    const rates = await ExchangeService.getRates();
    
    // Set caching headers for Edge CDN
    // s-maxage=300: Cache on Vercel Edge for 5 minutes
    // stale-while-revalidate=1800: Serve stale content for up to 30 minutes while revalidating
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Exchange API Error: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
