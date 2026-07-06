export type Region = 'india' | 'international'

export interface GeoInfo {
  region: Region
  country: string
  currency: string
  symbol: string
}

export async function detectUserRegion(): Promise<GeoInfo> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    if (data.country_code === 'IN') {
      return {
        region: 'india',
        country: 'India',
        currency: 'INR',
        symbol: '₹'
      }
    } else {
      return {
        region: 'international',
        country: data.country_name || 'Unknown',
        currency: 'USD',
        symbol: '$'
      }
    }
  } catch (error) {
    // Default to international if detection fails
    return {
      region: 'international',
      country: 'Unknown',
      currency: 'USD',
      symbol: '$'
    }
  }
}
