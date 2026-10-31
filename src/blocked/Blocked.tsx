import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, Sparkles, Flag, Wind, Sun, Cloud, CloudRain } from 'lucide-react';
import { DetoxSession, WeatherData, ActivityRecommendation } from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';
import { generateRecommendations } from '../weather';
import { PillarBadge } from '../components/PillarBadge';

// Living Nature Ambient Animation Canvas (Drifting Leaves, Twinkling Stars, Floating Starlight Dust)
const NatureAmbientCanvas: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Drifting foliage leaves floating across the landscape
    const leafCount = 28;
    const leaves = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 5 + Math.random() * 7,
      speedX: 0.9 + Math.random() * 1.6,
      speedY: 0.2 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.035,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      opacity: 0.4 + Math.random() * 0.45,
    }));

    // Twinkling stars in the night sky (active in dark mode)
    const starCount = 35;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: 0.8 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      maxOpacity: 0.4 + Math.random() * 0.55,
    }));

    // Gentle sunbeam / dust particles in daylight
    const dustCount = 25;
    const dustMotes = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.2 + Math.random() * 2,
      speedX: 0.3 + Math.random() * 0.6,
      speedY: -0.2 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Twinkling Stars (in Dark Mode)
      if (isDark) {
        stars.forEach(star => {
          star.pulse += star.pulseSpeed;
          const currentAlpha = Math.max(0.1, Math.sin(star.pulse) * star.maxOpacity);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 4;
          ctx.fill();
        });
      } else {
        // 2. Draw Sunlit Golden Dust Motes (in Light Mode)
        dustMotes.forEach(dust => {
          dust.x += dust.speedX;
          dust.y += dust.speedY;
          dust.pulse += dust.pulseSpeed;
          if (dust.x > width + 10) dust.x = -10;
          if (dust.y < -10) dust.y = height + 10;

          const currentAlpha = 0.25 + Math.sin(dust.pulse) * 0.25;
          ctx.beginPath();
          ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0.1, currentAlpha)})`;
          ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
          ctx.shadowBlur = 3;
          ctx.fill();
        });
      }

      // 3. Draw Fluttering Foliage Leaves
      leaves.forEach(leaf => {
        leaf.x += leaf.speedX;
        leaf.wobble += leaf.wobbleSpeed;
        leaf.y += leaf.speedY + Math.sin(leaf.wobble) * 0.6;
        leaf.rotation += leaf.rotSpeed;

        // Wrap around borders
        if (leaf.x > width + 20) {
          leaf.x = -20;
          leaf.y = Math.random() * (height * 0.8);
        }
        if (leaf.y > height + 20) {
          leaf.y = -10;
          leaf.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);

        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);

        if (isDark) {
          // Night leaves: soft moonlit silver / translucent sage
          ctx.fillStyle = `rgba(226, 232, 240, ${leaf.opacity * 0.85})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
          ctx.shadowBlur = 3;
        } else {
          // Day leaves: warm sunlit golden amber & olive green
          ctx.fillStyle = `rgba(134, 239, 172, ${leaf.opacity * 0.9})`;
          ctx.shadowColor = 'rgba(250, 204, 21, 0.3)';
          ctx.shadowBlur = 3;
        }
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};

export const BlockedIntervention: React.FC = () => {
  const [session, setSession] = useState<DetoxSession | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [attemptedDomain, setAttemptedDomain] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('domain') || '';
    } catch {
      return '';
    }
  });

  // Dynamic system theme listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Sync storage & session state
  useEffect(() => {
    getStorageData().then(data => {
      setSession(data.history.present.activeSession);
      setWeather(data.weather);
      setRemainingSeconds(calculateRemainingSeconds(data.history.present.activeSession));
      if (!attemptedDomain && data.history.present.restrictedSites.length > 0) {
        setAttemptedDomain(data.history.present.restrictedSites[0].domain);
      }
    });

    const unsubscribe = subscribeToStorage((data) => {
      const isStillActive = data.history.present.activeSession?.status === 'active';
      setSession(data.history.present.activeSession);
      setWeather(data.weather);
      setRemainingSeconds(calculateRemainingSeconds(data.history.present.activeSession));

      // If detox session was stopped, ended, or toggled off, automatically redirect back to the target site!
      if (!isStillActive) {
        const target = attemptedDomain || (data.history.present.restrictedSites[0]?.domain);
        if (target) {
          window.location.href = `https://${target}`;
        } else if (window.history.length > 1) {
          window.history.back();
        }
      }
    });

    return () => unsubscribe();
  }, [attemptedDomain]);

  // Timer tick effect with automatic refresh when timer runs out
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    if (session.isIndefinite) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(session);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        sendExtensionMessage({ type: 'SESSION_COMPLETE' });
        // Automatically refresh back into the website!
        const target = attemptedDomain || (session.selectedDomains && session.selectedDomains[0]);
        if (target) {
          window.location.href = `https://${target}`;
        } else if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.reload();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, attemptedDomain]);

  const handleReturnToFocus = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'dashboard.html';
    }
  };

  const handleEndSession = async () => {
    await sendExtensionMessage({ type: 'SESSION_CANCEL' });
    window.location.href = 'dashboard.html';
  };

  const recommendations = generateRecommendations(weather);
  const topRecommendation: ActivityRecommendation = recommendations[0];

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-4 h-4 text-amber-400" />;
    const c = weather.condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-4 h-4 text-sky-400" />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-4 h-4 text-slate-300" />;
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* 1. Full-Screen Edge-to-Edge Background Landscape */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden bg-slate-950">
        <img
          src={isDarkMode ? 'assets/landscape-dark.jpg' : 'assets/landscape-light.jpg'}
          alt="tabzero nature landscape"
          className="w-full h-full object-cover object-center animate-starry-drift scale-[1.03] transition-opacity duration-1000"
        />

        {/* Dynamic Vignette Shading for Immersive Contrast */}
        <div
          className={`absolute inset-0 transition-colors duration-1000 pointer-events-none ${
            isDarkMode
              ? 'bg-gradient-to-b from-black/45 via-black/15 to-black/60'
              : 'bg-gradient-to-b from-white/20 via-transparent to-black/25'
          }`}
        />

        {/* Soft Moon/Sun Pulsing Glow Aura */}
        <div
          className={`absolute top-[18%] right-[22%] w-64 h-64 rounded-full blur-[80px] pointer-events-none animate-celestial-glow ${
            isDarkMode
              ? 'bg-indigo-300/15'
              : 'bg-amber-300/35'
          }`}
        />

        {/* Shooting Stars in Dark Mode */}
        {isDarkMode && (
          <>
            <div className="absolute top-[12%] right-[42%] w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent rotate-[32deg] pointer-events-none animate-shooting-star-1" />
            <div className="absolute top-[8%] right-[28%] w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent rotate-[35deg] pointer-events-none animate-shooting-star-2" />
          </>
        )}
      </div>

      {/* 2. Living Ambient Particle Canvas (Twinkling Stars, Swaying Leaves) */}
      <NatureAmbientCanvas isDark={isDarkMode} />

      {/* 3. Overlaid Content Stack Directly on the Landscape */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-4 sm:space-y-5 z-10 py-6">

        {/* Top Stillness Pill */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border shadow-sm backdrop-blur-md transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-950/40 border-white/20 text-slate-200'
              : 'bg-white/80 border-white/80 text-slate-700'
          }`}
        >
          <Wind className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-300' : 'text-emerald-600'}`} />
          <span>A Moment of Stillness • Digital Detox Active</span>
        </div>

        {/* Calm Headline & Subtitle */}
        <div className="space-y-1">
          <h1
            className={`text-3xl sm:text-4xl font-light tracking-tight transition-colors duration-300 ${
              isDarkMode
                ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
                : 'text-slate-900 drop-shadow-[0_1px_8px_rgba(255,255,255,0.7)]'
            }`}
          >
            Take a deep breath.
          </h1>
          <p
            className={`text-xs sm:text-sm max-w-md mx-auto font-normal leading-relaxed transition-colors duration-300 ${
              isDarkMode
                ? 'text-slate-200 drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]'
                : 'text-slate-800 drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]'
            }`}
          >
            You chose to take a step back from screens.
            <br />
            Life is happening out here — gentle, unhurried, and real.
          </p>
        </div>

        {/* Weather & Location Pill */}
        {weather && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl border text-xs font-medium shadow-sm backdrop-blur-md transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-950/40 border-white/15 text-slate-200'
                : 'bg-white/75 border-white/80 text-slate-800'
            }`}
          >
            {getWeatherIcon()}
            <span>{weather.temperature}°C {weather.condition}</span>
            <span className="opacity-40">•</span>
            <span>{weather.city}</span>
          </div>
        )}

        {/* Translucent Glass Countdown Timer Card */}
        {session && session.status === 'active' && (
          <div
            className={`w-full max-w-xs rounded-2xl p-4 sm:p-5 border shadow-card backdrop-blur-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-950/45 border-white/20 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]'
                : 'bg-white/75 border-white/90 text-slate-900 shadow-[0_8px_32px_0_rgba(255,255,255,0.5)]'
            }`}
          >
            <div
              className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Session Remaining</span>
            </div>
            <div className="font-mono text-4xl sm:text-5xl font-light tracking-tight drop-shadow-sm">
              {formatTimeRemaining(remainingSeconds)}
            </div>
          </div>
        )}

        {/* Recommended Real-World Offline Activity Card */}
        {topRecommendation && (
          <div
            className={`w-full max-w-md rounded-2xl p-4 sm:p-4.5 border text-left shadow-card backdrop-blur-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-950/45 border-white/20 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]'
                : 'bg-white/75 border-white/90 text-slate-900 shadow-[0_8px_32px_0_rgba(255,255,255,0.5)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended While You're Offline</span>
              </div>
              <PillarBadge pillar={topRecommendation.pillar} size="sm" />
            </div>
            <h4 className="text-sm font-semibold tracking-tight">
              {topRecommendation.title}
            </h4>
            <p
              className={`text-xs mt-0.5 leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {isDarkMode
                ? 'Capture nature and beautiful night skies with your own eyes.'
                : topRecommendation.description}
            </p>
          </div>
        )}

        {/* Action Buttons: "Return to Zen" & "Admit Defeat" */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-1">
          <button
            onClick={handleReturnToFocus}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
              isDarkMode
                ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Zen</span>
          </button>

          <button
            onClick={handleEndSession}
            title="Surrender session early"
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer backdrop-blur-md border ${
              isDarkMode
                ? 'bg-black/35 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-white/15'
                : 'bg-white/60 hover:bg-rose-50/80 text-slate-700 hover:text-rose-700 border-white/80'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Admit Defeat</span>
          </button>
        </div>

        {/* Minimalist Footnote */}
        <p
          className={`text-[11px] font-medium pt-1 ${
            isDarkMode
              ? 'text-slate-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
              : 'text-slate-600 drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]'
          }`}
        >
          tabzero. — Life happens beyond the screen.
        </p>
      </div>
    </div>
  );
};
