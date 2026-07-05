const EXCHANGE_API_PRIMARY = 'https://api.exchangerate-api.com/v4/latest/USD';
const EXCHANGE_API_FALLBACK = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'usd_inr_rate';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

export interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  source: 'cached' | 'live' | 'fallback';
}

export async function getUSDToINR(): Promise<ExchangeRate> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < CACHE_DURATION) {
        return { rate: parsed.rate, lastUpdated: parsed.lastUpdated, source: 'cached' };
      }
    } catch (e) {
      console.warn("Failed to parse cached exchange rate:", e);
    }
  }

  try {
    const response = await fetch(EXCHANGE_API_PRIMARY);
    if (!response.ok) throw new Error("Primary API failed");
    const data = await response.json();
    const rate = data.rates.INR;

    // Cache it
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rate,
      timestamp: Date.now(),
      lastUpdated: new Date().toLocaleString('en-IN')
    }));

    return { rate, lastUpdated: new Date().toLocaleString('en-IN'), source: 'live' };
  } catch (primaryErr) {
    console.warn('Primary exchange rate fetch failed, trying fallback API:', primaryErr);
    try {
      const response = await fetch(EXCHANGE_API_FALLBACK);
      if (!response.ok) throw new Error("Fallback API failed");
      const data = await response.json();
      const rate = data.rates.INR || data.rates_by_code?.INR;
      
      if (!rate) throw new Error("INR rate missing in fallback response");

      // Cache it
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rate,
        timestamp: Date.now(),
        lastUpdated: new Date().toLocaleString('en-IN')
      }));

      return { rate, lastUpdated: new Date().toLocaleString('en-IN'), source: 'live' };
    } catch (fallbackErr) {
      // Fallback rate if API fails
      console.warn('All exchange rate fetches failed, using fallback rate of 84', fallbackErr);
      return { rate: 84, lastUpdated: 'Fallback rate', source: 'fallback' };
    }
  }
}

export function formatINR(usdAmount: number, rate: number): string {
  const inrAmount = Math.round(usdAmount * rate);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(inrAmount);
}

export const PLANS_USD = {
  free: { monthly: 0, annual: 0 },
  basic: { monthly: 9, annual: 7 },
  professional: { monthly: 29, annual: 23 },
  enterprise: { monthly: 99, annual: 79 }
};
