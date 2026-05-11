// Vercel serverless function — renders a server-side HTML page for a city
// Route: /manchester, /tokyo, /new-york etc. (via vercel.json rewrite → /api/city?slug=…)
// Response is cached at the edge for 24 hours.

const CITIES = {
  // ── United Kingdom ───────────────────────────────────────────
  london:      { name: 'London',            lat: 51.5074, lng:  -0.1278, radius: 3000, region: 'United Kingdom' },
  manchester:  { name: 'Manchester',        lat: 53.4808, lng:  -2.2426, region: 'United Kingdom' },
  birmingham:  { name: 'Birmingham',        lat: 52.4862, lng:  -1.8904, region: 'United Kingdom' },
  leeds:       { name: 'Leeds',             lat: 53.8008, lng:  -1.5491, region: 'United Kingdom' },
  glasgow:     { name: 'Glasgow',           lat: 55.8642, lng:  -4.2518, region: 'United Kingdom' },
  liverpool:   { name: 'Liverpool',         lat: 53.4084, lng:  -2.9916, region: 'United Kingdom' },
  edinburgh:   { name: 'Edinburgh',         lat: 55.9533, lng:  -3.1883, region: 'United Kingdom' },
  bristol:     { name: 'Bristol',           lat: 51.4545, lng:  -2.5879, region: 'United Kingdom' },
  sheffield:   { name: 'Sheffield',         lat: 53.3811, lng:  -1.4701, region: 'United Kingdom' },
  newcastle:   { name: 'Newcastle',         lat: 54.9783, lng:  -1.6178, region: 'United Kingdom' },
  nottingham:  { name: 'Nottingham',        lat: 52.9548, lng:  -1.1581, region: 'United Kingdom' },
  cardiff:     { name: 'Cardiff',           lat: 51.4816, lng:  -3.1791, region: 'United Kingdom' },
  leicester:   { name: 'Leicester',         lat: 52.6369, lng:  -1.1398, region: 'United Kingdom' },
  brighton:    { name: 'Brighton',          lat: 50.8225, lng:  -0.1372, region: 'United Kingdom' },
  oxford:      { name: 'Oxford',            lat: 51.7520, lng:  -1.2577, region: 'United Kingdom' },
  cambridge:   { name: 'Cambridge',         lat: 52.2053, lng:   0.1218, region: 'United Kingdom' },
  bath:        { name: 'Bath',              lat: 51.3781, lng:  -2.3597, region: 'United Kingdom' },
  york:        { name: 'York',              lat: 53.9600, lng:  -1.0873, region: 'United Kingdom' },
  exeter:      { name: 'Exeter',            lat: 50.7184, lng:  -3.5339, region: 'United Kingdom' },
  belfast:     { name: 'Belfast',           lat: 54.5973, lng:  -5.9301, region: 'United Kingdom' },

  // ── Europe ───────────────────────────────────────────────────
  paris:       { name: 'Paris',             lat: 48.8566, lng:   2.3522, region: 'Europe' },
  berlin:      { name: 'Berlin',            lat: 52.5200, lng:  13.4050, region: 'Europe' },
  madrid:      { name: 'Madrid',            lat: 40.4168, lng:  -3.7038, region: 'Europe' },
  rome:        { name: 'Rome',              lat: 41.9028, lng:  12.4964, region: 'Europe' },
  amsterdam:   { name: 'Amsterdam',         lat: 52.3676, lng:   4.9041, region: 'Europe' },
  barcelona:   { name: 'Barcelona',         lat: 41.3851, lng:   2.1734, region: 'Europe' },
  vienna:      { name: 'Vienna',            lat: 48.2082, lng:  16.3738, region: 'Europe' },
  warsaw:      { name: 'Warsaw',            lat: 52.2297, lng:  21.0122, region: 'Europe' },
  lisbon:      { name: 'Lisbon',            lat: 38.7223, lng:  -9.1393, region: 'Europe' },
  prague:      { name: 'Prague',            lat: 50.0755, lng:  14.4378, region: 'Europe' },

  // ── Asia ─────────────────────────────────────────────────────
  tokyo:          { name: 'Tokyo',          lat: 35.6762, lng: 139.6503, region: 'Asia' },
  seoul:          { name: 'Seoul',          lat: 37.5665, lng: 126.9780, region: 'Asia' },
  singapore:      { name: 'Singapore',      lat:  1.3521, lng: 103.8198, region: 'Asia' },
  bangkok:        { name: 'Bangkok',        lat: 13.7563, lng: 100.5018, region: 'Asia' },
  mumbai:         { name: 'Mumbai',         lat: 19.0760, lng:  72.8777, region: 'Asia' },
  delhi:          { name: 'Delhi',          lat: 28.6139, lng:  77.2090, region: 'Asia' },
  'hong-kong':    { name: 'Hong Kong',      lat: 22.3193, lng: 114.1694, region: 'Asia' },
  'kuala-lumpur': { name: 'Kuala Lumpur',   lat:  3.1390, lng: 101.6869, region: 'Asia' },
  bangalore:      { name: 'Bangalore',      lat: 12.9716, lng:  77.5946, region: 'Asia' },
  jakarta:        { name: 'Jakarta',        lat: -6.2088, lng: 106.8456, region: 'Asia' },

  // ── North America ─────────────────────────────────────────────
  'new-york':      { name: 'New York',       lat: 40.7128, lng:  -74.0060, region: 'North America' },
  'los-angeles':   { name: 'Los Angeles',    lat: 34.0522, lng: -118.2437, region: 'North America' },
  chicago:         { name: 'Chicago',        lat: 41.8781, lng:  -87.6298, region: 'North America' },
  toronto:         { name: 'Toronto',        lat: 43.6532, lng:  -79.3832, region: 'North America' },
  'mexico-city':   { name: 'Mexico City',    lat: 19.4326, lng:  -99.1332, region: 'North America' },
  houston:         { name: 'Houston',        lat: 29.7604, lng:  -95.3698, region: 'North America' },
  vancouver:       { name: 'Vancouver',      lat: 49.2827, lng: -123.1207, region: 'North America' },
  montreal:        { name: 'Montreal',       lat: 45.5017, lng:  -73.5673, region: 'North America' },
  seattle:         { name: 'Seattle',        lat: 47.6062, lng: -122.3321, region: 'North America' },
  'san-francisco': { name: 'San Francisco',  lat: 37.7749, lng: -122.4194, region: 'North America' },

  // ── South America ─────────────────────────────────────────────
  'sao-paulo':      { name: 'São Paulo',     lat: -23.5558, lng: -46.6396, region: 'South America' },
  'buenos-aires':   { name: 'Buenos Aires',  lat: -34.6037, lng: -58.3816, region: 'South America' },
  'rio-de-janeiro': { name: 'Rio de Janeiro',lat: -22.9068, lng: -43.1729, region: 'South America' },
  lima:             { name: 'Lima',          lat: -12.0464, lng: -77.0428, region: 'South America' },
  bogota:           { name: 'Bogotá',        lat:   4.7110, lng: -74.0721, region: 'South America' },
  santiago:         { name: 'Santiago',      lat: -33.4489, lng: -70.6693, region: 'South America' },
  medellin:         { name: 'Medellín',      lat:   6.2442, lng: -75.5812, region: 'South America' },
  quito:            { name: 'Quito',         lat:  -0.1807, lng: -78.4678, region: 'South America' },
  montevideo:       { name: 'Montevideo',    lat: -34.9011, lng: -56.1645, region: 'South America' },
  caracas:          { name: 'Caracas',       lat:  10.4806, lng: -66.9036, region: 'South America' },

  // ── Africa ────────────────────────────────────────────────────
  lagos:          { name: 'Lagos',           lat:   6.5244, lng:   3.3792, region: 'Africa' },
  cairo:          { name: 'Cairo',           lat:  30.0444, lng:  31.2357, region: 'Africa' },
  nairobi:        { name: 'Nairobi',         lat:  -1.2921, lng:  36.8219, region: 'Africa' },
  johannesburg:   { name: 'Johannesburg',    lat: -26.2041, lng:  28.0473, region: 'Africa' },
  'cape-town':    { name: 'Cape Town',       lat: -33.9249, lng:  18.4241, region: 'Africa' },
  casablanca:     { name: 'Casablanca',      lat:  33.5731, lng:  -7.5898, region: 'Africa' },
  accra:          { name: 'Accra',           lat:   5.6037, lng:  -0.1870, region: 'Africa' },
  'addis-ababa':  { name: 'Addis Ababa',     lat:   9.0320, lng:  38.7520, region: 'Africa' },
  kampala:        { name: 'Kampala',         lat:   0.3476, lng:  32.5825, region: 'Africa' },
  'dar-es-salaam':{ name: 'Dar es Salaam',   lat:  -6.7924, lng:  39.2083, region: 'Africa' },

  // ── Australasia ───────────────────────────────────────────────
  sydney:        { name: 'Sydney',           lat: -33.8688, lng: 151.2093, region: 'Australasia' },
  melbourne:     { name: 'Melbourne',        lat: -37.8136, lng: 144.9631, region: 'Australasia' },
  brisbane:      { name: 'Brisbane',         lat: -27.4698, lng: 153.0251, region: 'Australasia' },
  perth:         { name: 'Perth',            lat: -31.9505, lng: 115.8605, region: 'Australasia' },
  auckland:      { name: 'Auckland',         lat: -36.8509, lng: 174.7645, region: 'Australasia' },
  adelaide:      { name: 'Adelaide',         lat: -34.9285, lng: 138.6007, region: 'Australasia' },
  'gold-coast':  { name: 'Gold Coast',       lat: -28.0167, lng: 153.4000, region: 'Australasia' },
  wellington:    { name: 'Wellington',       lat: -41.2866, lng: 174.7756, region: 'Australasia' },
  canberra:      { name: 'Canberra',         lat: -35.2809, lng: 149.1300, region: 'Australasia' },
  christchurch:  { name: 'Christchurch',     lat: -43.5321, lng: 172.6362, region: 'Australasia' },
};

const REGION_ORDER = [
  'United Kingdom', 'Europe', 'Asia',
  'North America', 'South America', 'Africa', 'Australasia',
];

const DEFAULT_RADIUS = 5000;

const CHAIN_PATTERNS = [
  /starbucks/i, /mcc?af[eé]/i, /\bmc\s*donald/i, /tim\s+hortons?/i,
  /\bdunkin['\s]/i, /\bdunkin$/i, /caribou\s+coffee/i,
  /coffee\s+bean\s*(&|and)\s*tea/i, /gloria\s+jean/i, /\btully'?s\b/i,
  /second\s+cup/i, /seattle'?s\s+best/i, /\bpanera\b/i,
  /\bcosta\s+coffee\b|\bcosta\b(?!\s*rica)/i, /caff[eè]\s*nero/i,
  /\bcafe\s+nero\b/i, /pret\s+a\s+manger/i, /\bpret\b(?=\s|$)/i,
  /\bgreggs\b/i, /blank\s+street/i, /black\s+sheep\s+coffee/i,
  /\bbenugo\b/i, /soho\s+coffee/i, /joe\s*[&+]\s*the\s+juice/i,
  /\bpod\s+coffee\b/i, /coffee\s+republic/i, /harris\s*[+&]\s*hoole/i,
  /muffin\s+break/i, /wild\s+bean\s+cafe/i, /patisserie\s+val[eé]rie/i,
  /boston\s+tea\s+party/i, /\bpuccinos\b/i, /esquires\s+coffee/i,
  /caff[eè]\s+concerto/i, /\beat\.\s*$/i, /coffee\s*#\s*1\b/i,
  /coffee\s+no[\.\s]*1\b/i, /peet'?s\s+coffee/i, /dutch\s+bros/i,
  /espresso\s+house/i, /wayne'?s\s+coffee/i,
];

const DISQUALIFYING_TYPES = new Set([
  'performing_arts_theater','movie_theater','night_club','bar',
  'hair_care','beauty_salon','spa','nail_salon','barber',
  'gym','fitness_center','hospital','doctor','dentist','pharmacy',
  'florist','hardware_store','clothing_store','shoe_store',
  'furniture_store','electronics_store','book_store',
  'car_dealer','car_repair','gas_station',
  'bank','atm','insurance_agency','real_estate_agency',
  'lodging','hotel','art_gallery','museum','library',
  'school','university',
  'sandwich_shop','fast_food_restaurant','hamburger_restaurant',
  'pizza_restaurant','seafood_restaurant','steak_house',
  'sushi_restaurant','ramen_restaurant','chinese_restaurant',
  'japanese_restaurant','korean_restaurant','indian_restaurant',
  'mexican_restaurant','italian_restaurant','thai_restaurant',
  'vegetarian_restaurant','vegan_restaurant',
  'meal_takeaway','meal_delivery',
]);

function isChain(name) {
  if (!name) return false;
  return CHAIN_PATTERNS.some(p => p.test(name));
}

function isCoffeeVenue(place) {
  const types = place.types || [];
  const name  = (place.displayName?.text || '').toLowerCase();
  if (types.some(t => DISQUALIFYING_TYPES.has(t))) return false;
  if (types.some(t => ['cafe','coffee_shop','food','bakery','restaurant'].includes(t))) return true;
  if (/coffee|cafe|café|espresso|brew|roast|bean|cup|latte|cappuccino/.test(name)) return true;
  return false;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStars(rating) {
  if (!rating) return '';
  const full  = Math.floor(rating);
  const half  = (rating - full) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    `<span class="star-filled">${'★'.repeat(full + half)}</span>` +
    `<span class="star-empty">${'☆'.repeat(empty)}</span>`
  );
}

function renderCard(cafe) {
  const photo = cafe.photoUrl
    ? `<div class="relative h-44 bg-roast-100 overflow-hidden">
        <img src="${esc(cafe.photoUrl)}" alt="${esc(cafe.name)}" loading="lazy"
          class="w-full h-full object-cover" style="mix-blend-multiply:multiply">
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>`
    : `<div class="h-44 bg-roast-100 flex items-center justify-center text-roast-300">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/>
          <ellipse cx="12" cy="9" rx="2.2" ry="3" transform="rotate(15 12 9)"/>
        </svg>
      </div>`;

  const rating = cafe.rating
    ? `<div class="flex items-center gap-1.5 mt-2">
        <span class="text-sm leading-none">${renderStars(cafe.rating)}</span>
        <span class="text-roast-500 text-sm font-medium">${cafe.rating.toFixed(1)}</span>
        <span class="text-roast-300 text-xs">(${cafe.reviewCount.toLocaleString()})</span>
      </div>`
    : '';

  const desc = cafe.description
    ? `<p class="text-roast-500 text-sm leading-relaxed mt-2 line-clamp-2">${esc(cafe.description)}</p>`
    : '';

  const links = [
    cafe.website
      ? `<a href="${esc(cafe.website)}" target="_blank" rel="noopener"
            class="text-roast-500 hover:text-roast-800 text-xs font-medium underline underline-offset-2 transition-colors">Website</a>`
      : '',
    cafe.mapsUrl
      ? `<a href="${esc(cafe.mapsUrl)}" target="_blank" rel="noopener"
            class="text-roast-500 hover:text-roast-800 text-xs font-medium underline underline-offset-2 transition-colors">Google Maps</a>`
      : '',
  ].filter(Boolean).join('<span class="text-roast-200 mx-1">·</span>');

  return `
  <article class="bg-white rounded-2xl overflow-hidden card-shadow card-lift"
    itemscope itemtype="https://schema.org/CafeOrCoffeeShop">
    ${photo}
    <div class="p-4 sm:p-5">
      <h2 class="font-display font-semibold text-roast-800 text-lg leading-tight" itemprop="name">
        ${esc(cafe.name)}
      </h2>
      <p class="text-roast-400 text-sm mt-1 leading-snug" itemprop="address">${esc(cafe.address)}</p>
      ${rating}
      ${desc}
      ${cafe.allowsDogs === true ? `<span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 mt-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="17" rx="4" ry="3"/><ellipse cx="7" cy="14.5" rx="2" ry="2.5"/><ellipse cx="17" cy="14.5" rx="2" ry="2.5"/><ellipse cx="9" cy="9.5" rx="2" ry="2.5"/><ellipse cx="15" cy="9.5" rx="2" ry="2.5"/></svg> Dog friendly</span>` : ''}
      ${links ? `<div class="mt-3 flex flex-wrap gap-x-1 gap-y-1">${links}</div>` : ''}
    </div>
  </article>`;
}

function renderCityNav(currentSlug) {
  const byRegion = {};
  for (const [s, c] of Object.entries(CITIES)) {
    if (s === currentSlug) continue;
    if (!byRegion[c.region]) byRegion[c.region] = [];
    byRegion[c.region].push({ slug: s, name: c.name });
  }

  return REGION_ORDER.map(region => {
    const cities = byRegion[region];
    if (!cities) return '';
    const links = cities.map(c =>
      `<a href="/${esc(c.slug)}"
        class="px-3 py-1.5 bg-roast-50 hover:bg-roast-100 text-roast-600 hover:text-roast-800
          text-sm rounded-lg transition-colors focus-ring whitespace-nowrap">${esc(c.name)}</a>`
    ).join('');
    return `
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-widest text-roast-300 mb-2">${esc(region)}</h3>
      <div class="flex flex-wrap gap-2">${links}</div>
    </div>`;
  }).filter(Boolean).join('');
}

function renderPage(slug, cityConfig, cafes) {
  const { name: cityName } = cityConfig;

  const cards = cafes.map(renderCard).join('');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Independent Coffee Shops in ${cityName}`,
    url: `https://indi.cafe/${slug}`,
    itemListElement: cafes.map((cafe, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CafeOrCoffeeShop',
        name: cafe.name,
        address: cafe.address,
        ...(cafe.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: cafe.rating, reviewCount: cafe.reviewCount } } : {}),
        ...(cafe.website ? { url: cafe.website } : {}),
        ...(cafe.mapsUrl ? { hasMap: cafe.mapsUrl } : {}),
      },
    })),
  });

  const noResults = cafes.length === 0
    ? `<p class="text-roast-500 text-center py-12">No results found — try searching from your location instead.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Independent Coffee Shops in ${esc(cityName)} | indi.cafe</title>
  <meta name="description" content="Discover the best independent coffee shops in ${esc(cityName)}. No chains — just great local cafes, baristas and roasters.">
  <meta property="og:title" content="Independent Coffee in ${esc(cityName)} | indi.cafe">
  <meta property="og:description" content="The best independent coffee shops in ${esc(cityName)}, chain free.">
  <link rel="canonical" href="https://indi.cafe/${slug}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5263522779676417" crossorigin="anonymous"></script>
  <script defer src="/_vercel/insights/script.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            cream: '#FDF6EE',
            roast: {
               50: '#FDF6EE', 100: '#F5E8D7', 200: '#E8C9A8', 300: '#D4A06A',
              400: '#C17A2E', 500: '#9B5B1A', 600: '#7D3F10', 700: '#5C2C0A',
              800: '#3B1F0C', 900: '#1A0E06',
            },
          },
          fontFamily: {
            display: ['"Playfair Display"', 'Georgia', 'serif'],
            body:    ['Inter', 'system-ui', 'sans-serif'],
          },
        },
      },
    }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; }
    h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; }
    .card-shadow {
      box-shadow: 0 1px 2px rgba(59,31,12,0.07), 0 4px 12px rgba(59,31,12,0.08), 0 16px 40px rgba(59,31,12,0.05);
    }
    .card-lift {
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .card-lift:hover { transform: translateY(-2px); }
    .dot-pattern {
      background-image: radial-gradient(circle, rgba(253,246,238,0.12) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .focus-ring:focus-visible { outline: 2px solid #C17A2E; outline-offset: 2px; border-radius: 6px; }
    .star-filled { color: #E8A857; }
    .star-empty  { color: #E8C9A8; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    html { scroll-behavior: smooth; }
  </style>
  <script type="application/ld+json">${jsonLd}</script>
</head>

<body class="bg-cream text-roast-800 antialiased min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-roast-800 dot-pattern">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3 focus-ring rounded-lg p-1">
        <div class="w-9 h-9 rounded-full bg-roast-400 flex items-center justify-center flex-shrink-0"
          style="box-shadow:0 2px 8px rgba(59,31,12,0.25)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FDF6EE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/>
            <ellipse cx="12" cy="9" rx="2.2" ry="3" transform="rotate(15 12 9)"/>
            <path d="M12 6.5c-1.2 1-1.2 3 0 5" stroke-width="1.2"/>
          </svg>
        </div>
        <div>
          <p class="text-cream text-xl font-display font-bold tracking-tight leading-none">indi.cafe</p>
          <p class="text-roast-300 text-xs font-light tracking-wide mt-0.5">Independent Coffee Culture</p>
        </div>
      </a>
      <a href="/" class="text-roast-300 hover:text-cream text-sm transition-colors focus-ring">Find near me &rarr;</a>
    </div>
  </header>

  <!-- Hero -->
  <section class="bg-gradient-to-b from-roast-800 via-roast-700 to-roast-600 py-10 px-4 text-center">
    <h1 class="text-3xl md:text-4xl font-display font-bold text-cream leading-tight mb-3">
      Independent Coffee in ${esc(cityName)}
    </h1>
    <p class="text-roast-300 text-base max-w-lg mx-auto leading-relaxed">
      The best local, independent coffee shops in ${esc(cityName)} — no chains, no franchises.
      Just great baristas and roasters doing their own thing.
    </p>
  </section>

  <!-- Results -->
  <main class="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
    ${noResults}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${cards}
    </div>

    <!-- CTA -->
    <div class="mt-12 bg-roast-800 rounded-2xl p-7 text-center" style="box-shadow:0 4px 24px rgba(59,31,12,0.18)">
      <h2 class="text-xl font-display font-semibold text-cream mb-2">Find coffee near your exact location</h2>
      <p class="text-roast-300 text-sm mb-5">Use your GPS to discover independent cafes within walking distance, sorted by how close they are.</p>
      <a href="/" class="inline-block bg-roast-400 hover:bg-roast-300 text-cream font-semibold text-sm px-6 py-3 rounded-xl transition-colors focus-ring"
        style="box-shadow:0 2px 8px rgba(59,31,12,0.3)">
        Search near me &rarr;
      </a>
    </div>

    <!-- City directory -->
    <div class="mt-10">
      <h2 class="text-lg font-display font-semibold text-roast-700 mb-5">Browse cities</h2>
      <div class="space-y-5">
        ${renderCityNav(slug)}
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-roast-100 bg-white mt-auto">
    <div class="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="text-roast-400 text-xs">&copy; 2026 indi.cafe &mdash; Supporting independent coffee culture</p>
      <a href="/privacy" class="text-roast-300 text-xs hover:text-roast-600 transition-colors">Privacy Policy</a>
    </div>
  </footer>

</body>
</html>`;
}

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.rating', 'places.userRatingCount',
  'places.editorialSummary', 'places.websiteUri', 'places.photos',
  'places.types', 'places.googleMapsUri', 'places.allowsDogs',
].join(',');

module.exports = async function handler(req, res) {
  const { slug } = req.query || {};
  const cityConfig = CITIES[slug];

  if (!cityConfig) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('City not found');
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('GOOGLE_API_KEY not configured');
    return;
  }

  const { lat, lng, radius = DEFAULT_RADIUS } = cityConfig;

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
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius },
        },
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Places API error:', resp.status, errText);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Places API error');
      return;
    }

    placesData = await resp.json();
  } catch (err) {
    console.error('Places fetch failed:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Failed to reach Places API');
    return;
  }

  const places = placesData.places || [];

  const filtered = places
    .filter(p => !isChain(p.displayName?.text) && isCoffeeVenue(p))
    .map(p => ({
      name:        p.displayName?.text      || '',
      address:     p.formattedAddress       || '',
      rating:      p.rating                 || null,
      reviewCount: p.userRatingCount        || 0,
      description: p.editorialSummary?.text || null,
      allowsDogs:  p.allowsDogs             ?? null,
      website:     p.websiteUri             || null,
      mapsUrl:     p.googleMapsUri          || null,
      _photoName:  p.photos?.[0]?.name      || null,
    }))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.reviewCount - a.reviewCount)
    .slice(0, 9);

  await Promise.all(filtered.map(async item => {
    const photoName = item._photoName;
    delete item._photoName;
    if (!photoName) { item.photoUrl = null; return; }
    try {
      const photoResp = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
      );
      item.photoUrl = photoResp.ok ? ((await photoResp.json()).photoUri || null) : null;
    } catch {
      item.photoUrl = null;
    }
  }));

  const html = renderPage(slug, cityConfig, filtered);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
  res.status(200).end(html);
};
