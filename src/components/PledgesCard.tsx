import React, { useState } from 'react';
import { Target, Plus, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { OfflineActivity, Pledge } from '../types';

interface PledgesCardProps {
  pledges: Pledge[];
  activities: OfflineActivity[];
  onCreatePledge: (pledge: Omit<Pledge, 'id' | 'createdAt'>) => void;
  onAddActivity: (activity: Omit<OfflineActivity, 'id' | 'createdAt'>) => void;
  onCompleteActivity: (id: string) => void;
  compact?: boolean;
  isDark?: boolean;
}

export const PledgesCard: React.FC<PledgesCardProps> = ({
  pledges,
  activities,
  onCreatePledge,
  onAddActivity,
  onCompleteActivity,
  compact = false,
  isDark = false,
}) => {
  const [showAddPledge, setShowAddPledge] = useState(false);
  const [pledgeTitle, setPledgeTitle] = useState('');
  const [pledgeMinutes, setPledgeMinutes] = useState('45');

  const [showAddAct, setShowAddAct] = useState(false);
  const [actTitle, setActTitle] = useState('');
  const [actMinutes, setActMinutes] = useState('30');

  const handleCreatePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeTitle.trim()) return;
    onCreatePledge({
      title: pledgeTitle.trim(),
      targetMinutes: parseInt(pledgeMinutes, 10) || 30,
      isActive: true,
    });
    setPledgeTitle('');
    setShowAddPledge(false);
  };

  const handleCreateAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;
    onAddActivity({
      title: actTitle.trim(),
      durationMinutes: parseInt(actMinutes, 10) || 30,
      completed: false,
    });
    setActTitle('');
    setShowAddAct(false);
  };

  if (compact) {
    const pendingActivities = activities.filter(a => !a.completed);
    return (
      <div
        className={`rounded-2xl p-4 border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-slate-100'
            : 'bg-white border-slate-200/80 shadow-subtle text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wide">
              Planned Activities
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {pendingActivities.length} pending
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {pendingActivities.slice(0, 3).map(act => (
            <div
              key={act.id}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <span className={`truncate pr-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{act.title}</span>
              <button
                onClick={() => onCompleteActivity(act.id)}
                className="text-emerald-500 hover:text-emerald-400 p-0.5 rounded cursor-pointer"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {pendingActivities.length === 0 && (
            <p className="text-xs text-slate-400 italic py-1">No activities planned right now.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Daily Pledges */}
      <div
        className={`rounded-2xl p-6 border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-slate-100'
            : 'bg-white border-slate-200/80 shadow-subtle text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className={`text-base font-medium tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Digital Detox Pledges
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Personal commitments to screen-free boundaries.
            </p>
          </div>

          <button
            onClick={() => setShowAddPledge(!showAddPledge)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> {showAddPledge ? 'Close' : 'New Pledge'}
          </button>
        </div>

        {showAddPledge && (
          <form onSubmit={handleCreatePledge} className={`mb-4 p-3.5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <input
              type="text"
              placeholder="Commitment (e.g. No screens after 9:30 PM)"
              value={pledgeTitle}
              onChange={e => setPledgeTitle(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg outline-none border focus:border-indigo-400 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Mins"
                value={pledgeMinutes}
                onChange={e => setPledgeMinutes(e.target.value)}
                className={`w-28 px-2.5 py-1.5 text-xs rounded-lg outline-none border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
              >
                Save Pledge
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {pledges.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <div>
                  <h4 className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.title}</h4>
                  <p className="text-[10px] text-slate-400">{p.targetMinutes} minutes offline</p>
                </div>
              </div>
            </div>
          ))}
          {pledges.length === 0 && (
            <p className="text-xs text-slate-400 italic">No pledges active. Add your first digital detox pledge!</p>
          )}
        </div>
      </div>

      {/* 2. Planned Offline Activities (Integrated with Weather Recommendations) */}
      <div
        className={`rounded-2xl p-6 border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-slate-100'
            : 'bg-white border-slate-200/80 shadow-subtle text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-base font-medium tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Planned Offline Activities
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Tangible actions to reclaim your mind and body.
            </p>
          </div>

          <button
            onClick={() => setShowAddAct(!showAddAct)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> {showAddAct ? 'Close' : 'Add Activity'}
          </button>
        </div>

        {showAddAct && (
          <form onSubmit={handleCreateAct} className={`mb-4 p-3.5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <input
              type="text"
              placeholder="Activity name (e.g. Evening walk in park)"
              value={actTitle}
              onChange={e => setActTitle(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg outline-none border focus:border-indigo-400 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Mins"
                value={actMinutes}
                onChange={e => setActMinutes(e.target.value)}
                className={`w-28 px-2.5 py-1.5 text-xs rounded-lg outline-none border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
              >
                Save Activity
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {activities.map(act => (
            <div
              key={act.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                act.completed
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-500 line-through'
                    : 'bg-emerald-50/40 border-emerald-100 text-slate-400 line-through'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onCompleteActivity(act.id)}
                  title={act.completed ? 'Mark Incomplete' : 'Click to Mark Complete'}
                  className="cursor-pointer"
                >
                  {act.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 hover:text-emerald-500 transition-colors" />
                  )}
                </button>
                <div className="min-w-0">
                  <h4 className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {act.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span>{act.durationMinutes}m duration</span>
                    {act.weatherRecommended && (
                      <span className="text-indigo-400 flex items-center gap-0.5 font-medium">
                        <Sparkles className="w-2.5 h-2.5" /> Weather Match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-xs text-slate-400 italic">
              No planned activities. Click "+ Plan Activity" on any weather suggestion above!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
