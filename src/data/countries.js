export const countries = [
  { iso: 'US', name: 'United States', lat: 39.8, lng: -98.6, population: 334000000, gdp: 25.5, militaryRank: 1, nuclear: true, region: 'North America', flag: '\u{1F1FA}\u{1F1F8}', defaultAllies: ['GB','FR','DE','JP','KR','CA','AU'], defaultEnemies: ['RU','CN','IR'] },
  { iso: 'CN', name: 'China', lat: 35.9, lng: 104.2, population: 1412000000, gdp: 17.7, militaryRank: 3, nuclear: true, region: 'East Asia', flag: '\u{1F1E8}\u{1F1F3}', defaultAllies: ['RU','KP','PK'], defaultEnemies: ['US','JP','IN','TW'] },
  { iso: 'RU', name: 'Russia', lat: 61.5, lng: 105.3, population: 144000000, gdp: 1.78, militaryRank: 2, nuclear: true, region: 'Europe/Asia', flag: '\u{1F1F7}\u{1F1FA}', defaultAllies: ['CN','IR','BY','KP','SY'], defaultEnemies: ['US','GB','UA','DE','FR'] },
  { iso: 'IN', name: 'India', lat: 20.6, lng: 79.0, population: 1408000000, gdp: 3.39, militaryRank: 4, nuclear: true, region: 'South Asia', flag: '\u{1F1EE}\u{1F1F3}', defaultAllies: ['US','FR','JP'], defaultEnemies: ['CN','PK'] },
  { iso: 'GB', name: 'United Kingdom', lat: 55.4, lng: -3.4, population: 67000000, gdp: 3.07, militaryRank: 5, nuclear: true, region: 'Europe', flag: '\u{1F1EC}\u{1F1E7}', defaultAllies: ['US','FR','DE','CA','AU'], defaultEnemies: ['RU'] },
  { iso: 'FR', name: 'France', lat: 46.2, lng: 2.2, population: 68000000, gdp: 2.78, militaryRank: 7, nuclear: true, region: 'Europe', flag: '\u{1F1EB}\u{1F1F7}', defaultAllies: ['US','GB','DE'], defaultEnemies: ['RU'] },
  { iso: 'DE', name: 'Germany', lat: 51.2, lng: 10.4, population: 84000000, gdp: 4.07, militaryRank: 16, nuclear: false, region: 'Europe', flag: '\u{1F1E9}\u{1F1EA}', defaultAllies: ['US','FR','GB'], defaultEnemies: ['RU'] },
  { iso: 'JP', name: 'Japan', lat: 36.2, lng: 138.3, population: 125000000, gdp: 4.23, militaryRank: 8, nuclear: false, region: 'East Asia', flag: '\u{1F1EF}\u{1F1F5}', defaultAllies: ['US','KR','AU','IN'], defaultEnemies: ['CN','KP'] },
  { iso: 'KR', name: 'South Korea', lat: 35.9, lng: 127.8, population: 52000000, gdp: 1.67, militaryRank: 6, nuclear: false, region: 'East Asia', flag: '\u{1F1F0}\u{1F1F7}', defaultAllies: ['US','JP'], defaultEnemies: ['KP','CN'] },
  { iso: 'KP', name: 'North Korea', lat: 40.3, lng: 127.5, population: 26000000, gdp: 0.028, militaryRank: 30, nuclear: true, region: 'East Asia', flag: '\u{1F1F0}\u{1F1F5}', defaultAllies: ['CN','RU'], defaultEnemies: ['US','KR','JP'] },
  { iso: 'BR', name: 'Brazil', lat: -14.2, lng: -51.9, population: 214000000, gdp: 1.92, militaryRank: 12, nuclear: false, region: 'South America', flag: '\u{1F1E7}\u{1F1F7}', defaultAllies: ['US'], defaultEnemies: [] },
  { iso: 'AU', name: 'Australia', lat: -25.3, lng: 133.8, population: 26000000, gdp: 1.68, militaryRank: 17, nuclear: false, region: 'Oceania', flag: '\u{1F1E6}\u{1F1FA}', defaultAllies: ['US','GB','JP'], defaultEnemies: [] },
  { iso: 'CA', name: 'Canada', lat: 56.1, lng: -106.3, population: 39000000, gdp: 2.14, militaryRank: 23, nuclear: false, region: 'North America', flag: '\u{1F1E8}\u{1F1E6}', defaultAllies: ['US','GB','FR'], defaultEnemies: [] },
  { iso: 'IL', name: 'Israel', lat: 31.0, lng: 34.9, population: 9500000, gdp: 0.525, militaryRank: 18, nuclear: true, region: 'Middle East', flag: '\u{1F1EE}\u{1F1F1}', defaultAllies: ['US'], defaultEnemies: ['IR','SY'] },
  { iso: 'IR', name: 'Iran', lat: 32.4, lng: 53.7, population: 87000000, gdp: 0.368, militaryRank: 14, nuclear: false, region: 'Middle East', flag: '\u{1F1EE}\u{1F1F7}', defaultAllies: ['RU','CN','SY'], defaultEnemies: ['US','IL','SA'] },
  { iso: 'SA', name: 'Saudi Arabia', lat: 23.9, lng: 45.1, population: 36000000, gdp: 1.06, militaryRank: 22, nuclear: false, region: 'Middle East', flag: '\u{1F1F8}\u{1F1E6}', defaultAllies: ['US','AE'], defaultEnemies: ['IR'] },
  { iso: 'TR', name: 'Turkey', lat: 39.0, lng: 35.2, population: 85000000, gdp: 0.906, militaryRank: 11, nuclear: false, region: 'Europe/Asia', flag: '\u{1F1F9}\u{1F1F7}', defaultAllies: ['US'], defaultEnemies: ['SY'] },
  { iso: 'PK', name: 'Pakistan', lat: 30.4, lng: 69.3, population: 230000000, gdp: 0.376, militaryRank: 9, nuclear: true, region: 'South Asia', flag: '\u{1F1F5}\u{1F1F0}', defaultAllies: ['CN','TR'], defaultEnemies: ['IN'] },
  { iso: 'EG', name: 'Egypt', lat: 26.8, lng: 30.8, population: 104000000, gdp: 0.477, militaryRank: 15, nuclear: false, region: 'Africa', flag: '\u{1F1EA}\u{1F1EC}', defaultAllies: ['SA','US'], defaultEnemies: [] },
  { iso: 'UA', name: 'Ukraine', lat: 48.4, lng: 31.2, population: 44000000, gdp: 0.161, militaryRank: 19, nuclear: false, region: 'Europe', flag: '\u{1F1FA}\u{1F1E6}', defaultAllies: ['US','GB','DE','FR','PL'], defaultEnemies: ['RU','BY'] },
  { iso: 'PL', name: 'Poland', lat: 51.9, lng: 19.1, population: 38000000, gdp: 0.716, militaryRank: 20, nuclear: false, region: 'Europe', flag: '\u{1F1F5}\u{1F1F1}', defaultAllies: ['US','GB','DE','UA'], defaultEnemies: ['RU'] },
  { iso: 'IT', name: 'Italy', lat: 41.9, lng: 12.6, population: 59000000, gdp: 2.01, militaryRank: 10, nuclear: false, region: 'Europe', flag: '\u{1F1EE}\u{1F1F9}', defaultAllies: ['US','FR','DE'], defaultEnemies: [] },
  { iso: 'TW', name: 'Taiwan', lat: 23.7, lng: 121.0, population: 24000000, gdp: 0.791, militaryRank: 21, nuclear: false, region: 'East Asia', flag: '\u{1F1F9}\u{1F1FC}', defaultAllies: ['US','JP'], defaultEnemies: ['CN'] },
  { iso: 'AE', name: 'UAE', lat: 23.4, lng: 53.8, population: 10000000, gdp: 0.507, militaryRank: 27, nuclear: false, region: 'Middle East', flag: '\u{1F1E6}\u{1F1EA}', defaultAllies: ['SA','US'], defaultEnemies: ['IR'] },
  { iso: 'ID', name: 'Indonesia', lat: -0.8, lng: 113.9, population: 275000000, gdp: 1.32, militaryRank: 13, nuclear: false, region: 'Southeast Asia', flag: '\u{1F1EE}\u{1F1E9}', defaultAllies: [], defaultEnemies: [] },
  { iso: 'MX', name: 'Mexico', lat: 23.6, lng: -102.6, population: 129000000, gdp: 1.41, militaryRank: 31, nuclear: false, region: 'North America', flag: '\u{1F1F2}\u{1F1FD}', defaultAllies: ['US'], defaultEnemies: [] },
  { iso: 'BY', name: 'Belarus', lat: 53.7, lng: 28.0, population: 9400000, gdp: 0.073, militaryRank: 48, nuclear: false, region: 'Europe', flag: '\u{1F1E7}\u{1F1FE}', defaultAllies: ['RU'], defaultEnemies: ['UA','PL'] },
  { iso: 'SY', name: 'Syria', lat: 35.0, lng: 38.5, population: 22000000, gdp: 0.011, militaryRank: 47, nuclear: false, region: 'Middle East', flag: '\u{1F1F8}\u{1F1FE}', defaultAllies: ['RU','IR'], defaultEnemies: ['IL','TR','US'] },
  { iso: 'ZA', name: 'South Africa', lat: -30.6, lng: 22.9, population: 60000000, gdp: 0.405, militaryRank: 33, nuclear: false, region: 'Africa', flag: '\u{1F1FF}\u{1F1E6}', defaultAllies: ['IN','BR'], defaultEnemies: [] },
  { iso: 'NG', name: 'Nigeria', lat: 9.1, lng: 8.7, population: 218000000, gdp: 0.477, militaryRank: 36, nuclear: false, region: 'Africa', flag: '\u{1F1F3}\u{1F1EC}', defaultAllies: [], defaultEnemies: [] },
  { iso: 'SE', name: 'Sweden', lat: 60.1, lng: 18.6, population: 10000000, gdp: 0.585, militaryRank: 25, nuclear: false, region: 'Europe', flag: '\u{1F1F8}\u{1F1EA}', defaultAllies: ['US','GB','DE'], defaultEnemies: ['RU'] },
]

export function getCountryByIso(iso) {
  return countries.find((c) => c.iso === iso)
}

export function formatGdp(gdp) {
  if (gdp >= 1) return `$${gdp.toFixed(1)}T`
  return `$${(gdp * 1000).toFixed(0)}B`
}

export function formatPop(pop) {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(2)}B`
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(0)}M`
  return `${(pop / 1e3).toFixed(0)}K`
}
