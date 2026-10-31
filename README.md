# tabzero. — Digital Detox Browser Extension
> **"Life happens beyond the screen. Move more. Scroll less. Live more."**

**Team:** CodeNova  
**Theme:** HealthTech  
**Challenge:** IEEE Computer Society — CHAOS TO SOLUTION: AI Challenge (`#6ae588804ab5c72bd90cf843`)  
**Standard:** Google Chrome / Chromium Extension — Manifest V3  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Chrome Storage API, Chrome Declarative Net Request, Open-Meteo REST API, Express.js.

---

## 🌟 The Three Pillars of tabzero.

- **MOVE:** Physical movement, park runs, shaded cycling, yoga, and fresh-air mobility.
- **DISCONNECT:** Genuine domain-level blocking via dynamic DeclarativeNetRequest rules, commitments, and focus sessions.
- **RECONNECT:** Weather-informed offline activities utilizing the live Open-Meteo forecast API, human interactions, and nature grounding.

---

## 🚀 Quick Start — How to Load into Google Chrome

### 1. Build the Extension
```bash
npm install
npm run build
```
*(The production build is generated inside the `dist/` directory).*

### 2. Load into Chrome / Chromium
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked** in the top left corner.
4. Select the `dist/` folder inside this project directory (`c:\Users\aniru\VSCProjects\SJCHackathon\dist`).
5. Click the **tabzero.** icon in your extension bar to open the popup, or open `dashboard.html`.

### 3. (Optional) Run the Minimal REST API
```bash
npm run server
```
Runs at `http://localhost:3001` providing:
- `GET /api/health-status`
- `GET /api/weather` (Open-Meteo Proxy)
- `GET /api/recommendations` (Weather-based 3 pillars)
- `POST /api/summary` (Session & offline presence logging)

---

## 🧪 Automated Verification Suite

Run all verification tests with:
```bash
npm test
```
This automatically verifies:
1. **Mandatory 5-Step Undo/Redo Engine:** Executes the full 11-step challenge test protocol (adding sites, changing goals, creating pledges, adding activities, 5 consecutive undos to original state, 5 redos to restored state, and branch invalidation).
2. **Open-Meteo Integration & Backend API:** Validates live weather fetching from Open-Meteo, weather condition parsing, and all Express endpoints.

---

## 📋 15-Step Judging Demonstration Workflow

Follow this exact workflow for live presentation:

1. **Open tabzero.:** Click the extension icon in the Chrome toolbar or open `dashboard.html`.
2. **Explore Minimalist Dashboard:** Observe the wellness aesthetic, clean typography, soft muted accents, spacious layout, and real-time offline metrics.
3. **Add Instagram:** In the Website Restrictions card, ensure `instagram.com` is enabled or add it.
4. **Add YouTube:** In the Website Restrictions card, add or toggle `youtube.com`.
5. **Start a Custom Detox Session:** In the Focus card, configure custom Hours, Minutes, or Seconds and click **Start Detox Session**.
6. **Attempt to Visit Instagram:** In a new browser tab, navigate to `https://www.instagram.com`.
7. **Demonstrate Intervention Screen:** The browser dynamically intercepts and redirects navigation to `blocked.html`, presenting the living *Starry Night* motion art, live countdown, and the **Admit Defeat** option.
8. **Return to tabzero.:** Click **Return to Focus** on the intervention screen to safely resume.
9. **Observe Active Detox Timer:** View the live timestamp-based countdown with the deflection counter incremented.
10. **View Real Open-Meteo Weather:** Observe live temperature, humidity, wind, and weather-conditioned suggestions for MOVE, DISCONNECT, and RECONNECT. Click **Plan Activity** on any suggestion.
11. **Perform 5 Eligible Operations:**
    - Action 1: Add a new site (e.g., `snapchat.com`).
    - Action 2: Change the daily offline goal.
    - Action 3: Create a new pledge.
    - Action 4: Add another website (e.g., `pinterest.com`).
    - Action 5: Add a planned offline activity.
12. **Undo 5 Consecutive Times:** Click the **Undo** button in the top bar 5 times. Notice the counter decrementing (`5/5` down to `0/5`) and all items reverting to original state.
13. **Redo 5 Consecutive Times:** Click the **Redo** button 5 times. Notice the counter incrementing (`5/5`) and all 5 operations restored.
14. **Test Redo Clearing:** Undo 1 operation, perform a different action (e.g. edit daily goal), and verify Redo is cleared.
15. **Verify Persistence:** Refresh the dashboard tab or restart Chrome. Notice that all sessions, restricted lists, tracking metrics, and history stacks persist via `chrome.storage.local`.

---

## 🛡️ Manifest V3 Technical Architecture

- **`manifest.json`:** Chrome Extension MV3 with `declarativeNetRequest`, `storage`, `tabs`, `idle`, and `alarms`.
- **`src/background/index.ts`:** Service worker managing DeclarativeNetRequest dynamic rules, alarm-driven timer checks, window focus & idle tracking, and messaging bridge.
- **`src/history/index.ts`:** Snapshot-based 5-step reversible memory stack (`past`, `present`, `future`) with automatic DeclarativeNetRequest rule synchronization.
- **`src/weather/index.ts`:** Real Open-Meteo forecast API (`api.open-meteo.com/v1/forecast`) with WMO code translation and pillar-based recommendation logic.
- **`src/services/tracker.ts`:** Active tab and domain monitor respecting browser idle and window focus states.
