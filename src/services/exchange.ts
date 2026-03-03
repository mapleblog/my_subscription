// src/services/exchange.ts
import 'server-only';
import { redis } from '../lib/redis';

const API_KEY = process.env.EXCHANGE_API_KEY;
const DEFAULT_RATE_USD_TO_MYR = 4.75;
const DEFAULT_RATE_USD_TO_CNY = 7.25;
const DEFAULT_RATE_USD_TO_SGD = 1.35;
const DEFAULT_RATE_USD_TO_EUR = 0.93;
const CACHE_DURATION_SECONDS = 300;

interface ExchangeCache {
  rates: Record<string, number>;
  timestamp: number;
}

// In-memory fallback
let localCache: ExchangeCache = {
  rates: {
    USD: 1, // Base
    MYR: DEFAULT_RATE_USD_TO_MYR,
    CNY: DEFAULT_RATE_USD_TO_CNY,
    SGD: DEFAULT_RATE_USD_TO_SGD,
    EUR: DEFAULT_RATE_USD_TO_EUR,
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
    } catch {
      // Redis might fail or be unconfigured, fall through to API/Local
      // console.warn('Redis cache miss or error', error);
    }

    // 2. Check Local Memory Cache (for short term fallback if Redis fails)
    const now = Date.now();
    if (now - localCache.timestamp < CACHE_DURATION_SECONDS * 1000) {
      return localCache.rates;
    }

    try {
      // Prefer provider with API key if available
      const apiKeyUrl = API_KEY ? `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD` : null;
      // Hourly-updated public dataset (no key)
      const jsDelivrUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
      // Daily-updated public API (fallback)
      const openErApiUrl = 'https://open.er-api.com/v6/latest/USD';

      let sanitizedRates: Record<string, number> | null = null;

      // Try API key provider
      if (apiKeyUrl) {
        const res = await fetch(apiKeyUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const rates = data.conversion_rates || data.rates;
          if (rates && typeof rates === 'object') {
            sanitizedRates = {};
            for (const [code, value] of Object.entries(rates as Record<string, unknown>)) {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isFinite(numeric) && numeric > 0) {
                sanitizedRates[code.toUpperCase()] = numeric;
              }
            }
          }
        }
      }

      // Try jsDelivr hourly dataset if previous failed
      if (!sanitizedRates) {
        const res = await fetch(jsDelivrUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const usd = data.usd;
          if (usd && typeof usd === 'object') {
            sanitizedRates = { USD: 1 };
            for (const [code, value] of Object.entries(usd as Record<string, unknown>)) {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isFinite(numeric) && numeric > 0) {
                sanitizedRates[code.toUpperCase()] = numeric;
              }
            }
          }
        }
      }

      // Fallback to open er-api if still not set
      if (!sanitizedRates) {
        const res = await fetch(openErApiUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const rates = data.rates;
          if (rates && typeof rates === 'object') {
            sanitizedRates = {};
            for (const [code, value] of Object.entries(rates as Record<string, unknown>)) {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isFinite(numeric) && numeric > 0) {
                sanitizedRates[code.toUpperCase()] = numeric;
              }
            }
          }
        }
      }

      if (sanitizedRates) {
        if (!sanitizedRates.USD) {
          sanitizedRates.USD = 1;
        }
        if (!sanitizedRates.MYR) {
          sanitizedRates.MYR = DEFAULT_RATE_USD_TO_MYR;
        }
        if (!sanitizedRates.CNY) {
          sanitizedRates.CNY = DEFAULT_RATE_USD_TO_CNY;
        }
        if (!sanitizedRates.SGD) {
          sanitizedRates.SGD = DEFAULT_RATE_USD_TO_SGD;
        }
        if (!sanitizedRates.EUR) {
          sanitizedRates.EUR = DEFAULT_RATE_USD_TO_EUR;
        }

        localCache = {
          rates: sanitizedRates,
          timestamp: now,
        };

        try {
          await redis.set('exchange_rates:USD', sanitizedRates, { ex: CACHE_DURATION_SECONDS });
        } catch {}

        return sanitizedRates;
      }

      return localCache.rates;
    } catch (error) {
      // Safely log error to avoid serialization issues in Next.js DevTools
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to fetch exchange rates:', errorMessage);
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
    if (!Number.isFinite(amount)) return 0;
    if (fromCode === toCode) return amount;
    
    const rates = await ExchangeService.getRates();
    const fromRateRaw = rates[fromCode];
    const toRateRaw = rates[toCode];
    const fromRate = Number.isFinite(fromRateRaw) && fromRateRaw > 0 ? fromRateRaw : 1;
    const toRate = Number.isFinite(toRateRaw) && toRateRaw > 0 ? toRateRaw : 1;

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
