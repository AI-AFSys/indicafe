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
  /caff[eè]\s+bene/i,
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

const COFFEE_TYPES = new Set(['cafe', 'coffee_shop', 'food', 'bakery', 'restaurant']);
const COFFEE_NAME_RE = /coffee|cafe|café|espresso|brew|roast|bean|cup|latte|cappuccino/;

function isChain(name) {
  if (!name) return false;
  return CHAIN_PATTERNS.some(p => p.test(name));
}

function isCoffeeVenue(place) {
  const types = place.types || [];
  const name  = (place.displayName?.text || '').toLowerCase();
  if (types.some(t => DISQUALIFYING_TYPES.has(t))) return false;
  if (types.some(t => COFFEE_TYPES.has(t))) return true;
  return COFFEE_NAME_RE.test(name);
}

async function resolvePhotoUrl(photoName, apiKey) {
  if (!photoName) return null;
  try {
    const resp = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
    );
    return resp.ok ? ((await resp.json()).photoUri || null) : null;
  } catch {
    return null;
  }
}

module.exports = { isChain, isCoffeeVenue, resolvePhotoUrl };
