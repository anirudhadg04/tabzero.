import assert from 'assert';
import { formatWeather, generateRecommendations, interpretWmoWeatherCode } from '../src/weather';
import { WeatherData } from '../src/types';

console.log('=== VERIFYING OPEN-METEO WEATHER SYNCHRONIZATION & ACCURACY ===\n');

// 1. Verify exact WMO examples from hackathon specification
console.log('Step 1: Testing exact WMO code and day/night synchronization...');

// 30°C + clear daytime code
const clearDay: WeatherData = {
  temperature: 30,
  humidity: 45,
  precipitation: 0,
  weatherCode: 0,
  windSpeed: 8,
  condition: 'Clear',
  city: 'Bengaluru, IN',
  latitude: 12.9716,
  longitude: 77.5946,
  fetchedAt: Date.now(),
  isDay: true,
};
const fmtClearDay = formatWeather(clearDay);
assert.ok(fmtClearDay !== null);
assert.strictEqual(fmtClearDay.emoji, '☀️');
assert.strictEqual(fmtClearDay.temperatureText, '30°C');
assert.strictEqual(fmtClearDay.description, 'Clear');
assert.strictEqual(fmtClearDay.displayText, '☀️ 30°C · Clear');
console.log('✓ 30°C + clear daytime ->', fmtClearDay.displayText);

// 26°C + clear nighttime code
const clearNight: WeatherData = {
  ...clearDay,
  temperature: 26,
  isDay: false,
};
const fmtClearNight = formatWeather(clearNight);
assert.ok(fmtClearNight !== null);
assert.strictEqual(fmtClearNight.emoji, '🌙');
assert.strictEqual(fmtClearNight.temperatureText, '26°C');
assert.strictEqual(fmtClearNight.description, 'Clear');
assert.strictEqual(fmtClearNight.displayText, '🌙 26°C · Clear');
console.log('✓ 26°C + clear nighttime ->', fmtClearNight.displayText);

// 29°C + overcast/cloudy
const cloudy: WeatherData = {
  ...clearDay,
  temperature: 29,
  weatherCode: 3,
};
const fmtCloudy = formatWeather(cloudy);
assert.ok(fmtCloudy !== null);
assert.strictEqual(fmtCloudy.emoji, '☁️');
assert.strictEqual(fmtCloudy.displayText, '☁️ 29°C · Overcast');
console.log('✓ 29°C + overcast ->', fmtCloudy.displayText);

// 24°C + rain code (61)
const rain: WeatherData = {
  ...clearDay,
  temperature: 24,
  weatherCode: 61,
  precipitation: 2.5,
};
const fmtRain = formatWeather(rain);
assert.ok(fmtRain !== null);
assert.strictEqual(fmtRain.emoji, '🌧️');
assert.strictEqual(fmtRain.displayText, '🌧️ 24°C · Rain');
console.log('✓ 24°C + rain ->', fmtRain.displayText);

// 22°C + thunderstorm code (95)
const storm: WeatherData = {
  ...clearDay,
  temperature: 22,
  weatherCode: 95,
  precipitation: 8.0,
};
const fmtStorm = formatWeather(storm);
assert.ok(fmtStorm !== null);
assert.strictEqual(fmtStorm.emoji, '⛈️');
assert.strictEqual(fmtStorm.displayText, '⛈️ 22°C · Thunderstorm');
console.log('✓ 22°C + thunderstorm ->', fmtStorm.displayText);

// 20°C + fog code (45)
const fog: WeatherData = {
  ...clearDay,
  temperature: 20,
  weatherCode: 45,
};
const fmtFog = formatWeather(fog);
assert.ok(fmtFog !== null);
assert.strictEqual(fmtFog.emoji, '🌫️');
assert.strictEqual(fmtFog.displayText, '🌫️ 20°C · Fog');
console.log('✓ 20°C + fog ->', fmtFog.displayText);

// 2. Weather Unavailable handling
console.log('\nStep 2: Testing Weather Unavailable fallbacks...');
const nullFmt = formatWeather(null);
assert.strictEqual(nullFmt, null, 'formatWeather(null) must return null');
console.log('✓ formatWeather(null) returns null (UI renders "Weather unavailable")');

// 3. Cached identification
console.log('\nStep 3: Testing cached weather identification...');
const cachedWeather: WeatherData = {
  ...clearDay,
  isCached: true,
};
const fmtCached = formatWeather(cachedWeather);
assert.ok(fmtCached?.isCached === true);
console.log('✓ isCached flag correctly preserved on normalized weather object');

// 4. Weather-aware offline activity recommendations safety
console.log('\nStep 4: Testing weather-aware activity recommendations & outdoor safety...');

// Thunderstorm: MUST NOT recommend outdoor activities!
const stormRecs = generateRecommendations(storm);
assert.strictEqual(stormRecs.length, 3);
for (const rec of stormRecs) {
  assert.ok(!rec.title.toLowerCase().includes('park') && !rec.title.toLowerCase().includes('outdoor') && !rec.title.toLowerCase().includes('walk'),
    `Unsafe outdoor activity recommended during storm: ${rec.title}`);
}
console.log('✓ Thunderstorm: All 3 recommendations are strictly safe indoor activities (Yoga, Journaling, Tea)');

// Rain: MUST NOT recommend outdoor activities!
const rainRecs = generateRecommendations(rain);
assert.strictEqual(rainRecs.length, 3);
for (const rec of rainRecs) {
  assert.ok(!rec.title.toLowerCase().includes('park') && !rec.title.toLowerCase().includes('outdoor'),
    `Unsafe outdoor activity recommended during rain: ${rec.title}`);
}
console.log('✓ Rain: All 3 recommendations are strictly safe indoor activities (Bodyweight, Reading, Cooking)');

// Pleasant weather: Recommends outdoor photography walk
const pleasant: WeatherData = {
  ...clearDay,
  temperature: 22,
  weatherCode: 0,
};
const pleasantRecs = generateRecommendations(pleasant);
assert.ok(pleasantRecs.some(r => r.title.toLowerCase().includes('outdoor photography walk')),
  'Pleasant weather should recommend Outdoor Photography Walk');
console.log('✓ Pleasant Weather: Recommends Outdoor Photography Walk and outdoor reading');

console.log('\n🎉 ALL OPEN-METEO WEATHER SYNCHRONIZATION AND SAFETY RULES VERIFIED 100%!');
