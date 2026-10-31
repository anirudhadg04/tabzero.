import React from 'react';
import { Award, Zap, Clock, ShieldCheck, Flame, Ban } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsCardProps {
  achievements: Achievement[];
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'first_disconnect':
        return <Zap className="w-4 h-4" />;
      case 'reset_30':
        return <Clock className="w-4 h-4" />;
      case 'one_hour_free':
        return <ShieldCheck className="w-4 h-4" />;
      case 'deep_focus':
        return <Flame className="w-4 h-4" />;
      case 'scroll_breaker':
        return <Ban className="w-4 h-4" />;
      case 'consistency':
        return <Award className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-medium text-slate-900 tracking-tight">
              Milestones & Achievements
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Earned through genuine verified offline presence and screen boundaries.
          </p>
        </div>

        <div className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-xl">
          {unlockedCount} of {achievements.length} Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {achievements.map(ach => (
          <div
            key={ach.id}
            className={`p-4 rounded-xl border transition-all ${
              ach.unlocked
                ? 'bg-white border-indigo-100 shadow-sm'
                : 'bg-slate-50/50 border-slate-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className={`p-2 rounded-xl ${
                  ach.unlocked
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-slate-200/60 text-slate-400'
                }`}
              >
                {getIcon(ach.id)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-900 truncate">{ach.name}</h4>
                <span
                  className={`text-[10px] font-medium ${
                    ach.unlocked ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {ach.unlocked ? 'Unlocked' : `${ach.progress}% progress`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              {ach.description}
            </p>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  ach.unlocked ? 'bg-indigo-500' : 'bg-slate-300'
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
