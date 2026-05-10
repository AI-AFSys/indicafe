// Vercel serverless function — GET /api/geocode?address=…
// Calls Google Geocoding REST API server-side; API key never sent to the browser.

module.exports = async function handler(req, res) {
  const { address } = req.query || {};

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on the server' });
  }

  let data;
  try {
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    if (!resp.ok) {
      return res.status(502).json({ error: 'Geocoding API unreachable' });
    }
    data = await resp.json();
  } catch (err) {
    console.error('Geocoding fetch failed:', err);
    return res.status(502).json({ error: 'Failed to reach Geocoding API' });
  }

  if (data.status !== 'OK' || !data.results?.length) {
    return res.status(404).json({ error: 'Address not found' });
  }

  const { lat, lng } = data.results[0].geometry.location;
  res.status(200).json({
    lat,
    lng,
    formattedAddress: data.results[0].formatted_address,
  });
};
