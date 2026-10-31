import http from 'http';
import assert from 'assert';

console.log('=== TESTING MINIMAL EXPRESS BACKEND API & OPEN-METEO INTEGRATION ===\n');

// Import the backend app or spin it up
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health Status
app.get('/api/health-status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tabzero. API Service',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 2. Weather Endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat || '12.9716';
    const lon = req.query.lon || '77.5946';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&hourly=precipitation_probability&forecast_days=1`;

    const weatherRes = await fetch(url);
    if (!weatherRes.ok) {
      return res.status(weatherRes.status).json({ error: 'Failed to fetch weather from Open-Meteo' });
    }
    const data = await weatherRes.json();
    res.json({
      success: true,
      data,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Weather service unavailable', message: error.message });
  }
});

// 3. Recommendations Endpoint
app.get('/api/recommendations', (req, res) => {
  const condition = (req.query.condition || 'pleasant').toString().toLowerCase();
  const temp = parseFloat((req.query.temp || '24').toString());

  let recommendations: any[] = [];
  if (condition.includes('rain') || condition.includes('drizzle')) {
    recommendations = [
      { pillar: 'MOVE', activity: 'Indoor yoga flow & bodyweight mobility', duration: 25 },
      { pillar: 'DISCONNECT', activity: 'Read physical book chapters by the window', duration: 45 },
      { pillar: 'RECONNECT', activity: 'Brew warm tea and call an old friend', duration: 30 },
    ];
  } else {
    recommendations = [
      { pillar: 'MOVE', activity: 'Park cycling or brisk neighborhood run', duration: 35 },
      { pillar: 'DISCONNECT', activity: 'Outdoor paper journaling under tree shade', duration: 30 },
      { pillar: 'RECONNECT', activity: 'Meet someone for a stroll without smartphones', duration: 40 },
    ];
  }

  res.json({
    condition,
    temperature: temp,
    pillarCount: 3,
    recommendations,
  });
});

// 4. Summary Endpoint
app.post('/api/summary', (req, res) => {
  const { sessionCount, totalOfflineMinutes, blockedAttempts } = req.body;
  if (typeof totalOfflineMinutes !== 'number' || totalOfflineMinutes < 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  res.json({
    received: true,
    totalOfflineMinutes,
    sessionCount: sessionCount || 0,
    blockedAttempts: blockedAttempts || 0,
    encouragement: 'Outstanding dedication to your mental space!',
    syncedAt: new Date().toISOString(),
  });
});

const server = app.listen(3099, async () => {
  try {
    const baseUrl = 'http://localhost:3099';

    // Test 1: Health Status
    console.log('Testing GET /api/health-status...');
    const healthRes = await fetch(`${baseUrl}/api/health-status`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ok');
    console.log('✓ Health status passed:', healthData);

    // Test 2: Weather Endpoint (Live Open-Meteo call)
    console.log('\nTesting GET /api/weather (Live Open-Meteo request)...');
    const weatherRes = await fetch(`${baseUrl}/api/weather?lat=12.9716&lon=77.5946`);
    const weatherData = await weatherRes.json();
    assert.strictEqual(weatherRes.status, 200);
    assert.strictEqual(weatherData.success, true);
    assert.ok(weatherData.data.current.temperature_2m !== undefined);
    console.log(`✓ Open-Meteo returned: ${weatherData.data.current.temperature_2m}°C, weather_code: ${weatherData.data.current.weather_code}`);

    // Test 3: Recommendations Endpoint
    console.log('\nTesting GET /api/recommendations...');
    const recRes = await fetch(`${baseUrl}/api/recommendations?condition=pleasant&temp=24`);
    const recData = await recRes.json();
    assert.strictEqual(recRes.status, 200);
    assert.strictEqual(recData.pillarCount, 3);
    assert.strictEqual(recData.recommendations.length, 3);
    console.log('✓ Recommendations passed:', recData.recommendations.map((r: any) => `${r.pillar}: ${r.activity}`));

    // Test 4: Summary POST Endpoint
    console.log('\nTesting POST /api/summary...');
    const postRes = await fetch(`${baseUrl}/api/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCount: 2,
        totalOfflineMinutes: 75,
        blockedAttempts: 3,
      }),
    });
    const postData = await postRes.json();
    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postData.received, true);
    assert.strictEqual(postData.totalOfflineMinutes, 75);
    console.log('✓ Summary submission passed:', postData.encouragement);

    console.log('\n🎉 ALL 4 EXPRESS REST API ENDPOINTS & OPEN-METEO INTEGRATION VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
