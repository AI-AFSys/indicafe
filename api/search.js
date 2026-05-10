// Vercel serverless function — GET /api/search?lat=…&lng=…&radius=…
// Calls Google Places API v1 server-side; API key never sent to the browser.

const CHAIN_PATTERNS = [
  // ── GLOBAL ───────────────────────────────────────────────────
  /starbucks/i,
  /mcc?af[eé]/i,
  /\bmc\s*donald/i,
  /tim\s+hortons?/i,
  /\bdunkin['\s]/i,
  /\bdunkin$/i,
  /caribou\s+coffee/i,
  /coffee\s+bean\s*(&|and)\s*tea/i,
  /gloria\s+jean/i,
  /\btully'?s\b/i,
  /second\s+cup/i,
  /seattle'?s\s+best/i,
  /\bpanera\b/i,

  // ── UK ───────────────────────────────────────────────────────
  /\bcosta\s+coffee\b|\bcosta\b(?!\s*rica)/i,
  /caff[eè]\s*nero/i,
  /\bcafe\s+nero\b/i,
  /pret\s+a\s+manger/i,
  /\bpret\b(?=\s|$)/i,
  /\bgreggs\b/i,
  /blank\s+street/i,
  /black\s+sheep\s+coffee/i,
  /\bbenugo\b/i,
  /soho\s+coffee/i,
  /joe\s*[&+]\s*the\s+juice/i,
  /\bpod\s+coffee\b/i,
  /coffee\s+republic/i,
  /harris\s*[+&]\s*hoole/i,
  /muffin\s+break/i,
  /wild\s+bean\s+cafe/i,
  /patisserie\s+val[eé]rie/i,
  /boston\s+tea\s+party/i,
  /\bpuccinos\b/i,
  /esquires\s+coffee/i,
  /caff[eè]\s+concerto/i,
  /\beat\.\s*$/i,
  /coffee\s*#\s*1\b/i,
  /coffee\s+no[\.\s]*1\b/i,

  // ── USA ──────────────────────────────────────────────────────
  /peet'?s\s+coffee/i,
  /dutch\s+bros/i,
  /scooter'?s\s+coffee/i,
  /\bphilz\s+coffee\b/i,
  /\bbiggby\b/i,
  /human\s+bean/i,
  /\bdunn\s+brothers\b/i,
  /\bpj'?s\s+coffee\b/i,
  /\bellianos\b/i,
  /\b7\s*brew\b/i,
  /\bzigg[iy]'?s\s+coffee\b/i,
  /au\s+bon\s+pain/i,
  /corner\s+bakery/i,
  /einstein\s+bros/i,
  /bruegger'?s/i,

  // ── AUSTRALIA & NZ ───────────────────────────────────────────
  /the\s+coffee\s+club/i,
  /zarraffa'?s/i,
  /michel'?s\s+patisserie/i,
  /jamaica\s+blue/i,
  /hudsons?\s+coffee/i,
  /\bdome\s+coffee\b/i,
  /\bdegani\b/i,
  /columbus\s+coffee/i,

  // ── GERMANY & AUSTRIA ────────────────────────────────────────
  /\btchibo\b/i,
  /balzac\s+coffee/i,
  /coffee\s+fellows/i,
  /\bmarché\b|\bmarche\b/i,

  // ── FRANCE ───────────────────────────────────────────────────
  /columbus\s+caf[eé]/i,
  /brioche\s+dor[eé]e/i,
  /\bpaul\s+(bakery|boulangerie|caf[eé])\b/i,
  /\bangelina\s+paris\b/i,

  // ── NETHERLANDS & BELGIUM ────────────────────────────────────
  /bagels?\s*[&+]\s*beans?/i,
  /doppio\s+espresso/i,
  /coffee\s+company/i,
  /\bkaldi\b/i,

  // ── NORDIC ───────────────────────────────────────────────────
  /espresso\s+house/i,
  /wayne'?s\s+coffee/i,
  /robert'?s\s+coffee/i,

  // ── ITALY ────────────────────────────────────────────────────
  /\bautogrill\b/i,

  // ── SPAIN ────────────────────────────────────────────────────
  /caf[eé]\s*[&+]\s*t[eé]/i,

  // ── JAPAN ────────────────────────────────────────────────────
  /\bdoutor\b/i,
  /\bkomeda\b/i,
  /st\.?\s*marc\s+caf[eé]/i,
  /excelsior\s+caf[eé]/i,
  /caf[eé]\s+de\s+cri[eé]/i,
  /\bveloce\b/i,

  // ── SOUTH KOREA ──────────────────────────────────────────────
  /\bediya\b/i,
  /caff[eé]\s+bene/i,
  /tom\s+n\s+toms/i,
  /a\s+twosome\s+place/i,
  /\bhollys\s+coffee\b/i,
  /compose\s+coffee/i,
  /\bmega\s+coffee\b/i,
  /angel.in.us/i,

  // ── CHINA & HONG KONG ────────────────────────────────────────
  /\bluckin\s+coffee\b/i,
  /\bmanner\s+coffee\b/i,
  /pacific\s+coffee/i,

  // ── INDIA ────────────────────────────────────────────────────
  /caf[eé]\s+coffee\s+day/i,
  /\bbarista\s+coffee\b/i,
  /\bbarista\s+lavazza\b/i,

  // ── LATIN AMERICA ────────────────────────────────────────────
  /juan\s+valdez/i,
  /caf[eé]\s+mart[ií]nez/i,

  // ── AFRICA ───────────────────────────────────────────────────
  /mugg\s*[&+]\s*bean/i,
  /vida\s+e\s+caff[eé]/i,
  /seattle\s+coffee\s+company/i,
];

const DISQUALIFYING_TYPES = new Set([
  'performing_arts_theater', 'movie_theater', 'night_club', 'bar',
  'hair_care', 'beauty_salon', 'spa', 'nail_salon', 'barber',
  'gym', 'fitness_center', 'health',
  'hospital', 'doctor', 'dentist', 'pharmacy',
  'florist', 'hardware_store', 'clothing_store', 'shoe_store',
  'furniture_store', 'electronics_store', 'book_store',
  'car_dealer', 'car_repair', 'gas_station',
  'bank', 'atm', 'insurance_agency', 'real_estate_agency',
  'lodging', 'hotel',
  'art_gallery', 'museum', 'library',
  'school', 'university',
  'sandwich_shop', 'fast_food_restaurant', 'hamburger_restaurant',
  'pizza_restaurant', 'seafood_restaurant', 'steak_house',
  'sushi_restaurant', 'ramen_restaurant', 'chinese_restaurant',
  'japanese_restaurant', 'korean_restaurant', 'indian_restaurant',
  'mexican_restaurant', 'italian_restaurant', 'thai_restaurant',
  'vegetarian_restaurant', 'vegan_restaurant',
  'meal_takeaway', 'meal_delivery',
]);

function isChain(name) {
  if (!name) return false;
  return CHAIN_PATTERNS.some(p => p.test(name));
}

function isCoffeeVenue(place) {
  const types = place.types || [];
  const name  = (place.displayName?.text || '').toLowerCase();

  // Reject if a disqualifying type is present
  if (types.some(t => DISQUALIFYING_TYPES.has(t))) return false;

  // Accept if it has a recognisable food/cafe type
  if (types.some(t => ['cafe', 'coffee_shop', 'food', 'bakery', 'restaurant'].includes(t))) return true;

  // Accept if the name contains coffee-related words
  if (/coffee|cafe|café|espresso|brew|roast|bean|cup|latte|cappuccino/.test(name)) return true;

  return false;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R  = 6371000;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTravelMode(m) {
  if (m <= 750)  return 'walking';
  if (m <= 2800) return 'cycling';
  return 'driving';
}

function estimateTime(m, mode) {
  const road   = m * 1.35;
  const speeds = { walking: 80, cycling: 250, driving: 480 };
  const mins   = Math.max(1, Math.round(road / speeds[mode]));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), rem = mins % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.editorialSummary',
  'places.reviews',
  'places.websiteUri',
  'places.regularOpeningHours',
  'places.photos',
  'places.types',
  'places.primaryType',
  'places.googleMapsUri',
].join(',');

module.exports = async function handler(req, res) {
  const { lat, lng, radius = '1000' } = req.query || {};

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on the server' });
  }

  const userLat      = parseFloat(lat);
  const userLng      = parseFloat(lng);
  const searchRadius = Math.min(parseFloat(radius), 50000);

  let placesData;
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: 'coffee',
        // textSearch uses locationBias (not locationRestriction) for circle regions
        locationBias: {
          circle: {
            center: { latitude: userLat, longitude: userLng },
            radius: searchRadius,
          },
        },
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Places API error:', resp.status, errText);
      return res.status(502).json({ error: 'Places API error', detail: errText });
    }

    placesData = await resp.json();
  } catch (err) {
    console.error('Places API fetch failed:', err);
    return res.status(502).json({ error: 'Failed to reach Places API' });
  }

  const places = placesData.places || [];

  const filtered = places
    .filter(p => !isChain(p.displayName?.text) && isCoffeeVenue(p))
    .map(p => {
      // map first so we have distanceM for the radius filter below
      const placeLat = p.location.latitude;
      const placeLng = p.location.longitude;
      const dist     = haversine(userLat, userLng, placeLat, placeLng);
      const mode     = getTravelMode(dist);

      return {
        name:        p.displayName?.text       || '',
        address:     p.formattedAddress        || '',
        lat:         placeLat,
        lng:         placeLng,
        rating:      p.rating                  || null,
        reviewCount: p.userRatingCount         || 0,
        description: p.editorialSummary?.text  || null,
        reviews:     (p.reviews || []).map(r => ({
          author:      r.authorAttribution?.displayName || 'Anonymous',
          rating:      r.rating                         || null,
          text:        r.text?.text                     || '',
          relativeTime: r.relativePublishTimeDescription || '',
        })),
        website:     p.websiteUri              || null,
        mapsUrl:     p.googleMapsUri           || null,
        isOpenNow:   p.regularOpeningHours?.openNow ?? null,
        distanceM:   Math.round(dist),
        distanceText: fmtDist(dist),
        travelMode:  mode,
        travelTime:  estimateTime(dist, mode),
        _photoName:  p.photos?.[0]?.name       || null,
      };
    })
    .filter(item => item.distanceM <= searchRadius)  // hard-enforce radius (locationBias is soft)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 10);

  // Resolve photo CDN URLs in parallel (skipHttpRedirect avoids exposing API key in img src)
  await Promise.all(filtered.map(async item => {
    const photoName = item._photoName;
    delete item._photoName;

    if (!photoName) { item.photoUrl = null; return; }

    try {
      const photoResp = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
      );
      if (photoResp.ok) {
        const photoData = await photoResp.json();
        item.photoUrl = photoData.photoUri || null;
      } else {
        item.photoUrl = null;
      }
    } catch {
      item.photoUrl = null;
    }
  }));

  res.status(200).json({ results: filtered });
};
