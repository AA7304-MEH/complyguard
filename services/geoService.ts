export type Region = 'india' | 'international'

export interface GeoInfo {
  region: Region
  country: string
  currency: string
  symbol: string
}

export async function detectUserRegion(): Promise<GeoInfo> {
  // Check timezone and browser locale first for instant reliable detection
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const language = navigator.language || '';

  const isIndianByTimezone = 
    timezone.includes('Kolkata') || 
    timezone.includes('Calcutta') || 
    timezone.includes('Delhi') || 
    timezone.includes('Mumbai') ||
    language.includes('IN');

  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.country_code === 'IN' || isIndianByTimezone) {
      return {
        region: 'india',
        country: 'India',
        currency: 'INR',
        symbol: '₹'
      };
    } else {
      return {
        region: 'international',
        country: data.country_name || 'International',
        currency: 'USD',
        symbol: '$'
      };
    }
  } catch (error) {
    if (isIndianByTimezone) {
      return {
        region: 'india',
        country: 'India',
        currency: 'INR',
        symbol: '₹'
      };
    }
    return {
      region: 'international',
      country: 'International',
      currency: 'USD',
      symbol: '$'
    };
  }
}
