export const BASE_CURRENCY = "EUR";
export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "SEK"];

const EXCHANGE_RATES_API = `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=${SUPPORTED_CURRENCIES.join(",")}`;

export async function getExchangeRates() {
  const response = await fetch(EXCHANGE_RATES_API);

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates (${response.status})`);
  }

  const payload = await response.json();

  return {
    ...payload.rates,
    [BASE_CURRENCY]: 1,
  };
}
