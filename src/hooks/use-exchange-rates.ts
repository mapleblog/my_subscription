
'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExchangeRates {
  [currency: string]: number;
}

interface UseExchangeRatesResult {
  rates: ExchangeRates | null;
  isLoading: boolean;
  error: Error | null;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number | null;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    const fetchRates = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/exchange');
        if (!res.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        const data = await res.json();
        if (mounted) {
          setRates(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Fallback rates could be handled here if needed, 
          // but the API route should already return fallback rates on error.
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRates();
    intervalId = window.setInterval(fetchRates, 300000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchRates();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const convert = useCallback((amount: number, fromCurrency: string, toCurrency: string): number | null => {
    if (!rates) return null;
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (fromRate === undefined || toRate === undefined) {
      return null;
    }

    // Base currency is USD (implied by the API structure returning rates relative to USD, 
    // or whatever the base is. The service says "Currently hardcoded to fetch USD base".)
    // If rates are all based on USD:
    // ValueInUSD = Amount / FromRate
    // ValueInTarget = ValueInUSD * ToRate
    // Target = Amount * ToRate / FromRate

    if (fromRate === 0) return 0; // Avoid division by zero

    return (amount / fromRate) * toRate;
  }, [rates]);

  return { rates, isLoading, error, convert };
}
