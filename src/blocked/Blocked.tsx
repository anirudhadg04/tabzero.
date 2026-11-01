import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, Sparkles, Flag, Wind, Sun, Cloud, CloudRain, CloudOff } from 'lucide-react';
import { DetoxSession, WeatherData, ActivityRecommendation } from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';
import { formatWeather, generateRecommendations } from '../weather';

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
    const leafCount = 24;
    const leaves = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 5 + Math.random() * 6,
      speedX: 0.8 + Math.random() * 1.4,
      speedY: 0.2 + Math.random() * 0.6,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      opacity: 0.35 + Math.random() * 0.4,
    }));

    // Twinkling stars in the night sky (active in dark mode)
    const starCount = 30;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: 0.8 + Math.random() * 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      maxOpacity: 0.35 + Math.random() * 0.45,
    }));

    // Gentle sunbeam / dust particles in daylight
    const dustCount = 20;
    const dustMotes = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.2 + Math.random() * 1.8,
      speedX: 0.25 + Math.random() * 0.5,
      speedY: -0.15 + Math.random() * 0.3,
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

          const currentAlpha = 0.2 + Math.sin(dust.pulse) * 0.2;
          ctx.beginPath();
          ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 235, 210, ${Math.max(0.1, currentAlpha)})`;
          ctx.fill();
        });
      }

      // 3. Draw Fluttering Foliage Leaves
      leaves.forEach(leaf => {
        leaf.x += leaf.speedX;
        leaf.wobble += leaf.wobbleSpeed;
        leaf.y += leaf.speedY + Math.sin(leaf.wobble) * 0.5;
        leaf.rotation += leaf.rotSpeed;

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
          ctx.fillStyle = `rgba(200, 210, 205, ${leaf.opacity * 0.75})`;
        } else {
          ctx.fillStyle = `rgba(125, 175, 140, ${leaf.opacity * 0.8})`;
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
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};

export const BlockedIntervention: React.FC = () => {
  const [session, setSession] = useState<DetoxSession | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [attemptedDomain, setAttemptedDomain] = useState<string | null>(null);

  // Dynamic system theme listener
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Parse original destination website from URL search parameters or session storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const domainFromUrl = params.get('site') || params.get('url') || params.get('domain');

    if (domainFromUrl) {
      setAttemptedDomain(domainFromUrl);
      sessionStorage.setItem('tabzero_attempted_site', domainFromUrl);
    } else {
      const saved = sessionStorage.getItem('tabzero_attempted_site');
      if (saved) {
        setAttemptedDomain(saved);
      }
    }
  }, []);

  useEffect(() => {
    getStorageData().then(d => {
      setSession(d.history.present.activeSession);
      setWeather(d.weather);
      setThemePref(d.themePreference || 'system');
      setRemainingSeconds(calculateRemainingSeconds(d.history.present.activeSession));
      if (!d.weather) {
        sendExtensionMessage({ type: 'REFRESH_WEATHER' }).then(updated => {
          setWeather(updated.weather);
        }).catch(() => {});
      }
    });

    const unsubscribe = subscribeToStorage((updated) => {
      setSession(updated.history.present.activeSession);
      setWeather(updated.weather);
      setThemePref(updated.themePreference || 'system');
      setRemainingSeconds(calculateRemainingSeconds(updated.history.present.activeSession));
    });

    return () => unsubscribe();
  }, []);

  const isDarkMode = themePref === 'dark' ? true : themePref === 'light' ? false : systemIsDark;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  const redirectToOriginalSite = () => {
    if (attemptedDomain) {
      let targetUrl = attemptedDomain.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      window.location.href = targetUrl;
    } else {
      window.location.href = 'dashboard.html';
    }
  };

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(session));
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(session);
      setRemainingSeconds(remaining);
      if (!session.isIndefinite && remaining <= 0) {
        clearInterval(interval);
        sendExtensionMessage({ type: 'SESSION_COMPLETE' });
        redirectToOriginalSite();
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

  const handleAdmitDefeat = async () => {
    await sendExtensionMessage({ type: 'SESSION_CANCEL' });
    redirectToOriginalSite();
  };

  const formattedWeather = formatWeather(weather);
  const recommendations = generateRecommendations(weather);
  const topRecommendation: ActivityRecommendation = recommendations[0];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* 1. Full-Screen Edge-to-Edge Background Landscape */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden bg-stone-950">
        <img
          src={isDarkMode ? 'assets/landscape-dark.jpg' : 'assets/landscape-light.jpg'}
          alt="tabzero nature landscape"
          className="w-full h-full object-cover object-center scale-[1.02] transition-opacity duration-700"
        />

        {/* Dynamic Vignette Shading for Immersive Contrast */}
        <div
          className={`absolute inset-0 transition-colors duration-700 pointer-events-none ${
            isDarkMode
              ? 'bg-gradient-to-b from-black/50 via-black/25 to-black/65'
              : 'bg-gradient-to-b from-white/30 via-transparent to-black/20'
          }`}
        />
      </div>

      {/* 2. Living Ambient Particle Canvas (Twinkling Stars, Swaying Leaves) */}
      <NatureAmbientCanvas isDark={isDarkMode} />

      {/* 3. Overlaid Content Stack */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-4 z-10 py-6">

        {/* Top Stillness Indicator */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide border backdrop-blur-md transition-colors ${
            isDarkMode
              ? 'bg-stone-950/50 border-white/15 text-stone-300'
              : 'bg-white/85 border-white/80 text-stone-700 shadow-subtle'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
          <span>A Moment of Stillness • Digital Detox Active</span>
        </div>

        {/* Calm Headline & Subtitle */}
        <div className="space-y-1">
          <h1
            className={`text-2xl sm:text-3xl font-light tracking-tight transition-colors ${
              isDarkMode
                ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
                : 'text-stone-900 drop-shadow-[0_1px_4px_rgba(255,255,255,0.7)]'
            }`}
          >
            Take a deep breath.
          </h1>
          <p
            className={`text-xs sm:text-sm max-w-sm mx-auto font-normal leading-relaxed transition-colors ${
              isDarkMode
                ? 'text-stone-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
                : 'text-stone-700 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]'
            }`}
          >
            You chose to step back from screens.
            <br />
            Life is happening beyond this device.
          </p>
        </div>

        {/* Weather & Location */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium backdrop-blur-md transition-colors ${
            isDarkMode
              ? 'bg-stone-950/50 border-white/15 text-stone-300'
              : 'bg-white/80 border-white/80 text-stone-800 shadow-subtle'
          }`}
        >
          {formattedWeather ? (
            <>
              <span className="text-sm select-none" role="img" aria-label={formattedWeather.description}>
                {formattedWeather.emoji}
              </span>
              <span>{formattedWeather.temperatureText} · {formattedWeather.description}</span>
              <span className="opacity-30">•</span>
              <span>{formattedWeather.locationText}</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 opacity-60" />
              <span>Weather unavailable</span>
            </>
          )}
        </div>

        {/* Countdown Timer */}
        {session && session.status === 'active' && (
          <div
            className={`w-full max-w-xs rounded-xl p-4 border backdrop-blur-md transition-colors ${
              isDarkMode
                ? 'bg-stone-950/50 border-white/15 text-white'
                : 'bg-white/85 border-white/80 text-stone-900 shadow-subtle'
            }`}
          >
            <div
              className={`flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Session Remaining</span>
            </div>
            <div className="font-mono text-4xl sm:text-5xl font-light tracking-tight tabular-nums">
              {formatTimeRemaining(remainingSeconds)}
            </div>
          </div>
        )}

        {/* Recommended Offline Activity */}
        {topRecommendation && (
          <div
            className={`w-full max-w-sm rounded-xl p-3.5 border text-left backdrop-blur-md transition-colors ${
              isDarkMode
                ? 'bg-stone-950/50 border-white/15 text-white'
                : 'bg-white/85 border-white/80 text-stone-900 shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-700 dark:text-sage-300">
                Recommended Offline
              </span>
              <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-400">
                {topRecommendation.durationMinutes}m
              </span>
            </div>
            <h4 className="text-xs font-semibold tracking-tight">
              {topRecommendation.title}
            </h4>
            <p
              className={`text-[11px] mt-0.5 leading-relaxed ${
                isDarkMode ? 'text-stone-300' : 'text-stone-600'
              }`}
            >
              {topRecommendation.description}
            </p>
          </div>
        )}

        {/* Actions: Return to Focus & Admit Defeat */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
          <button
            onClick={handleReturnToFocus}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-lg bg-sage-600 hover:bg-sage-700 text-white transition-colors cursor-pointer shadow-subtle"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Focus</span>
          </button>

          <button
            onClick={handleAdmitDefeat}
            title="Surrender session early and return to website"
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border backdrop-blur-md ${
              isDarkMode
                ? 'bg-stone-900/60 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border-white/15'
                : 'bg-white/70 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border-white/80 shadow-subtle'
            }`}
          >
            <Flag className="w-3 h-3" />
            <span>Admit Defeat</span>
          </button>
        </div>

        {/* Minimalist Brand Mark */}
        <div className="flex items-center gap-1.5 pt-2 opacity-75">
          <img
            src="icons/icon16.png"
            alt="tabzero logo"
            className="w-3.5 h-3.5 rounded-full object-cover"
          />
          <p className="text-[11px] text-stone-400 font-medium">
            tabzero. — Life happens beyond the screen.
          </p>
        </div>
      </div>
    </div>
  );
};
