import { useEffect, useMemo, useState } from "react";

export const BASE_CURRENCY = "EUR";
export const FALLBACK_RATES = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.87,
  SEK: 11.3,
};

const DEFAULT_SOURCE = "European Central Bank";
const ECB_RATES_ENDPOINT = "https://api.exchangerate.host/latest?base=EUR&symbols=EUR,USD,GBP,SEK";

const formatApiTimestamp = (payload) => {
  if (payload?.date) {
    const utcDate = new Date(`${payload.date}T00:00:00Z`);
    if (!Number.isNaN(utcDate.getTime())) {
      return utcDate.toISOString();
    }
  }

  return new Date().toISOString();
};

export function useExchangeRates() {
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [baseCurrency, setBaseCurrency] = useState(BASE_CURRENCY);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [dataPulledAt, setDataPulledAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await fetch(ECB_RATES_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Unexpected response: ${response.status}`);
        }

        const payload = await response.json();
        const nextRates = {
          ...FALLBACK_RATES,
          ...(payload?.rates ?? {}),
        };

        if (!isMounted) {
          return;
        }

        setRates(nextRates);
        setBaseCurrency(payload?.base ?? BASE_CURRENCY);
        setSource(DEFAULT_SOURCE);
        setLastUpdated(formatApiTimestamp(payload));
        setDataPulledAt(new Date().toISOString());
        setError(null);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setRates(FALLBACK_RATES);
        setBaseCurrency(BASE_CURRENCY);
        setSource(`${DEFAULT_SOURCE} (fallback)`);
        setLastUpdated(new Date().toISOString());
        setDataPulledAt(new Date().toISOString());
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, []);

  const isFallback = useMemo(() => Boolean(error), [error]);

  return {
    rates,
    baseCurrency,
    source,
    lastUpdated,
    dataPulledAt,
    loading,
    error,
    isFallback,
  };
}
