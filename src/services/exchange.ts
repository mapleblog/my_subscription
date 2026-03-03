// src/services/exchange.ts
import 'server-only';
import { redis } from '../lib/redis';

const API_KEY = process.env.EXCHANGE_API_KEY;
const DEFAULT_RATE_USD_TO_MYR = 4.75;
const CACHE_DURATION_SECONDS = 3600; // 1 hour

interface ExchangeCache {
  rates: Record<string, number>;
  timestamp: number;
}

// In-memory fallback
let localCache: ExchangeCache = {
  rates: {
    USD: 1, // Base
    MYR: DEFAULT_RATE_USD_TO_MYR,
  },
  timestamp: 0,
};

/**
 * Service to handle currency exchange rates.
 * Uses ExchangeRate-API with fallback and caching (Redis + Memory).
 */
export const ExchangeService = {
  /**
   * Fetches the latest exchange rates.
   * Currently hardcoded to fetch USD base.
   */
  getRates: async (): Promise<Record<string, number>> => {
    // 1. Try Redis Cache
    try {
      const cachedRates = await redis.get<Record<string, number>>('exchange_rates:USD');
      if (cachedRates) {
        return cachedRates;
      }
    } catch (error) {
      // Redis might fail or be unconfigured, fall through to API/Local
      // console.warn('Redis cache miss or error', error);
    }

    // 2. Check Local Memory Cache (for short term fallback if Redis fails)
    const now = Date.now();
    if (now - localCache.timestamp < CACHE_DURATION_SECONDS * 1000) {
      return localCache.rates;
    }

    try {
      let url = 'https://open.er-api.com/v6/latest/USD'; // Default to free open API
      
      if (API_KEY) {
        url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
      }

      // Example API call (adjust URL based on specific provider)
      const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
      
      if (!res.ok) {
         throw new Error(`Exchange API error: ${res.statusText}`);
      }

      const data = await res.json();
      
      const rates = data.rates || data.conversion_rates;
      
      if (rates) {
        
        // Update Local Cache
        localCache = {
          rates: rates,
          timestamp: now,
        };

        // Update Redis Cache
        try {
          await redis.set('exchange_rates:USD', rates, { ex: CACHE_DURATION_SECONDS });
        } catch (e) {
          // Ignore redis set error
        }

        return rates;
      }
      
      return localCache.rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates', error);
      return localCache.rates;
    }
  },

  /**
   * Converts an amount from one currency to another.
   * Uses BigInt for precision during calculation, then rounds to nearest integer cent.
   * @param amount Amount in cents (integer)
   * @param fromCode Currency code (e.g. "USD")
   * @param toCode Target currency code (e.g. "MYR")
   * @returns Converted amount in cents (integer)
   */
  convert: async (amount: number, fromCode: string, toCode: string = 'MYR'): Promise<number> => {
    if (fromCode === toCode) return amount;
    
    const rates = await ExchangeService.getRates();
    const fromRate = rates[fromCode] || 1; 
    const toRate = rates[toCode] || 1;

    // Formula: Target = Source / SourceRate * TargetRate
    // We use BigInt with a scaling factor of 10^8 to preserve precision
    // 1.00000000 -> 100000000n
    
    const SCALE = 100000000n;
    
    const amountBig = BigInt(Math.round(amount)); // Ensure integer input
    const fromRateBig = BigInt(Math.round(fromRate * Number(SCALE)));
    const toRateBig = BigInt(Math.round(toRate * Number(SCALE)));

    // Target = (Amount * SCALE / FromRate * SCALE * ToRate) / SCALE
    // Wait, simpler:
    // ValueInBase = (Amount * SCALE) / FromRate
    // ValueInTarget = ValueInBase * ToRate
    
    // We can simplify: Target = Amount * ToRate / FromRate
    // With scaling: Target = (Amount * ToRateBig) / FromRateBig
    
    // However, if we multiplied rates by SCALE, we effectively have:
    // Target = (Amount * (ToRate * SCALE)) / (FromRate * SCALE)
    // The SCALEs cancel out.
    // So: Target = (Amount * ToRateBig) / FromRateBig
    
    // But we need to handle the division remainder for rounding.
    // Result = (Amount * ToRateBig) / FromRateBig
    
    if (fromRateBig === 0n) return amount; // Avoid division by zero, should not happen

    const numerator = amountBig * toRateBig;
    const result = numerator / fromRateBig;
    
    // Standard rounding check: is remainder >= denominator / 2 ?
    const remainder = numerator % fromRateBig;
    const halfDenominator = fromRateBig / 2n;
    
    let finalResult = result;
    if (remainder >= halfDenominator) {
      finalResult += 1n;
    }

    return Number(finalResult);
  }
};
