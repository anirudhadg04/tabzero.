import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health Status Endpoint
app.get('/api/health-status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tabzero. API Service',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 2. Weather Endpoint (Open-Meteo proxy)
app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat || '12.9716';
    const lon = req.query.lon || '77.5946';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const weatherRes = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!weatherRes.ok) {
      return res.status(weatherRes.status).json({
        error: 'Failed to fetch weather from Open-Meteo API',
      });
    }

    const data = await weatherRes.json();
    res.json({
      success: true,
      data,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Weather service unavailable',
      message: error.message,
    });
  }
});

// 3. Recommendations Endpoint
app.get('/api/recommendations', (req, res) => {
  const condition = (req.query.condition || 'pleasant').toLowerCase();
  const temp = parseFloat(req.query.temp || '24');

  let recommendations = [];

  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunder')) {
    recommendations = [
      { pillar: 'MOVE', activity: 'Indoor yoga flow & bodyweight mobility', duration: 25 },
      { pillar: 'DISCONNECT', activity: 'Read physical book chapters by the window', duration: 45 },
      { pillar: 'RECONNECT', activity: 'Brew warm tea and call an old friend', duration: 30 },
    ];
  } else if (temp > 30) {
    recommendations = [
      { pillar: 'MOVE', activity: 'Light early-morning or shaded walk', duration: 20 },
      { pillar: 'DISCONNECT', activity: 'Visit an air-conditioned quiet library', duration: 60 },
      { pillar: 'RECONNECT', activity: 'Iced beverage catch-up in a cool café', duration: 35 },
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

// 4. Summary Submission Endpoint
app.post('/api/summary', (req, res) => {
  const { sessionCount, totalOfflineMinutes, blockedAttempts } = req.body;

  if (typeof totalOfflineMinutes !== 'number' || totalOfflineMinutes < 0) {
    return res.status(400).json({
      error: 'Invalid input: totalOfflineMinutes must be a non-negative number.',
    });
  }

  const encouragement =
    totalOfflineMinutes >= 60
      ? 'Outstanding dedication to your mental space and real-world living!'
      : 'Great start! Small screen-free moments accumulate into profound presence.';

  res.json({
    received: true,
    totalOfflineMinutes,
    sessionCount: sessionCount || 0,
    blockedAttempts: blockedAttempts || 0,
    encouragement,
    syncedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[tabzero. API] Server running on http://localhost:${PORT}`);
});
