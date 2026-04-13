import * as topojson from 'topojson-client'

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

let cachedGeo = null

export async function fetchCountryGeo() {
  if (cachedGeo) return cachedGeo

  const res = await fetch(TOPO_URL)
  const topo = await res.json()
  const geo = topojson.feature(topo, topo.objects.countries)
  cachedGeo = geo
  return geo
}

export function geoToLineSegments(geo) {
  const segments = []

  for (const feature of geo.features) {
    const polys =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : []

    for (const polygon of polys) {
      for (const ring of polygon) {
        const points = []
        for (const [lng, lat] of ring) {
          points.push({ lat, lng })
        }
        segments.push({ id: feature.id, points })
      }
    }
  }
  return segments
}

export function pointInCountry(lat, lng, geo) {
  for (const feature of geo.features) {
    if (pointInFeature(lat, lng, feature)) {
      return feature
    }
  }
  return null
}

function pointInFeature(lat, lng, feature) {
  const polys =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : []

  for (const polygon of polys) {
    if (pointInRing(lng, lat, polygon[0])) return true
  }
  return false
}

function pointInRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

const ISO_NUMERIC_TO_ALPHA = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '024': 'AO', '032': 'AR', '036': 'AU', '040': 'AT',
  '050': 'BD', '056': 'BE', '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW', '076': 'BR',
  '100': 'BG', '104': 'MM', '108': 'BI', '112': 'BY', '116': 'KH', '120': 'CM', '124': 'CA',
  '140': 'CF', '144': 'LK', '148': 'TD', '152': 'CL', '156': 'CN', '170': 'CO', '178': 'CG',
  '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY', '203': 'CZ', '204': 'BJ',
  '208': 'DK', '214': 'DO', '218': 'EC', '818': 'EG', '222': 'SV', '226': 'GQ', '232': 'ER',
  '233': 'EE', '231': 'ET', '242': 'FJ', '246': 'FI', '250': 'FR', '266': 'GA', '268': 'GE',
  '276': 'DE', '288': 'GH', '300': 'GR', '320': 'GT', '324': 'GN', '328': 'GY', '332': 'HT',
  '340': 'HN', '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ',
  '372': 'IE', '376': 'IL', '380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP', '398': 'KZ',
  '400': 'JO', '404': 'KE', '408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG', '418': 'LA',
  '422': 'LB', '426': 'LS', '428': 'LV', '430': 'LR', '434': 'LY', '440': 'LT', '442': 'LU',
  '450': 'MG', '454': 'MW', '458': 'MY', '466': 'ML', '478': 'MR', '484': 'MX', '496': 'MN',
  '498': 'MD', '504': 'MA', '508': 'MZ', '512': 'OM', '516': 'NA', '524': 'NP', '528': 'NL',
  '540': 'NC', '554': 'NZ', '558': 'NI', '562': 'NE', '566': 'NG', '578': 'NO', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL', '620': 'PT',
  '630': 'PR', '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW', '682': 'SA', '686': 'SN',
  '688': 'RS', '694': 'SL', '702': 'SG', '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO',
  '710': 'ZA', '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD', '740': 'SR', '748': 'SZ',
  '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ', '764': 'TH', '768': 'TG', '780': 'TT',
  '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM', '800': 'UG', '804': 'UA', '807': 'MK',
  '826': 'GB', '834': 'TZ', '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE',
  '887': 'YE', '894': 'ZM', '158': 'TW',
}

export function numericIdToIso(numId) {
  const padded = String(numId).padStart(3, '0')
  return ISO_NUMERIC_TO_ALPHA[padded] || null
}
