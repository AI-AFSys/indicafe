// Vercel serverless function — GET /api/search?lat=…&lng=…&radius=…
// Calls Google Places API v1 server-side; API key never sent to the browser.

const { isChain, isCoffeeVenue, resolvePhotoUrl } = require('./shared');

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
  const { lat, lng, radius = '5000' } = req.query || {};

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on the server' });
  }

  const userLat      = parseFloat(lat);
  const userLng      = parseFloat(lng);
  const searchRadius = Math.min(Math.abs(parseFloat(radius)) || 5000, 50000);

  if (isNaN(userLat) || isNaN(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

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
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 10);

  await Promise.all(filtered.map(async item => {
    const photoName = item._photoName;
    delete item._photoName;
    item.photoUrl = await resolvePhotoUrl(photoName, apiKey);
  }));

  res.status(200).json({ results: filtered });
};
