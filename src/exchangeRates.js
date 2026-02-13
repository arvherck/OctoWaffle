export const BASE_CURRENCY = "EUR";

export const EXCHANGE_RATES = {
  EUR: { USD: 1.08, GBP: 0.87 },
  USD: { EUR: 0.93, GBP: 0.8 },
  GBP: { EUR: 1.14, USD: 1.25 },
};

export const SUPPORTED_CURRENCIES = [
  BASE_CURRENCY,
  ...Object.keys(EXCHANGE_RATES[BASE_CURRENCY] ?? {}),
];

export const getExchangeRate = (baseCurrency, targetCurrency) => {
  if (baseCurrency === targetCurrency) {
    return 1;
  }

  return EXCHANGE_RATES[baseCurrency]?.[targetCurrency] ?? 1;
};
