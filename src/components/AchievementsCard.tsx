import React from 'react';
import { Award, Zap, Clock, ShieldCheck, Flame, Ban } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsCardProps {
  achievements: Achievement[];
  isDark?: boolean;
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements, isDark = false }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'first_disconnect':
        return <Zap className="w-3.5 h-3.5" />;
      case 'reset_30':
        return <Clock className="w-3.5 h-3.5" />;
      case 'one_hour_free':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'deep_focus':
        return <Flame className="w-3.5 h-3.5" />;
      case 'scroll_breaker':
        return <Ban className="w-3.5 h-3.5" />;
      case 'consistency':
        return <Award className="w-3.5 h-3.5" />;
      default:
        return <Award className="w-3.5 h-3.5" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div
      className={`rounded-xl p-5 border transition-colors ${
        isDark
          ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
          : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h3 className="text-sm font-semibold tracking-tight">Milestones & Achievements</h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Earned through genuine verified offline presence and screen boundaries.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
          {unlockedCount} of {achievements.length} Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map(ach => (
          <div
            key={ach.id}
            className={`p-3.5 rounded-lg border transition-colors ${
              ach.unlocked
                ? isDark
                  ? 'bg-[#121316]/60 border-sage-900/50'
                  : 'bg-[#FAF9F6] border-sage-200/60'
                : isDark
                ? 'bg-[#121316]/20 border-[#282A30]/50 opacity-45'
                : 'bg-[#F9F8F5] border-[#EFEFEA] opacity-50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={`p-1.5 rounded-md ${
                  ach.unlocked
                    ? 'bg-sage-100 text-sage-700 dark:bg-sage-950 dark:text-sage-300'
                    : 'bg-stone-200/50 text-stone-400 dark:bg-stone-800'
                }`}
              >
                {getIcon(ach.id)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-medium truncate">{ach.name}</h4>
                <span className="font-mono text-[10px] tabular-nums text-stone-400">
                  {ach.unlocked ? 'Unlocked ✓' : `${ach.progress}% progress`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mb-2.5 line-clamp-2">
              {ach.description}
            </p>

            <div className="w-full bg-stone-200/60 dark:bg-stone-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  ach.unlocked ? 'bg-sage-600' : 'bg-stone-400'
                }`}
                style={{ width: `${ach.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
