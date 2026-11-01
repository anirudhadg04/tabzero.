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
        className={`rounded-xl p-3.5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Planned Activities
            </h4>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-stone-400">
            {pendingActivities.length} pending
          </span>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
          {pendingActivities.slice(0, 3).map(act => (
            <div
              key={act.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded-md border text-xs transition-colors ${
                isDark ? 'bg-[#121316]/60 border-[#282A30]/60' : 'bg-[#FAF9F6] border-[#F0EFEA]'
              }`}
            >
              <span className={`truncate pr-2 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                {act.title}
              </span>
              <button
                onClick={() => onCompleteActivity(act.id)}
                className="text-sage-600 hover:text-sage-700 p-0.5 rounded cursor-pointer transition-colors"
                title="Mark complete"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {pendingActivities.length === 0 && (
            <p className="text-xs text-stone-400 italic py-1">No activities planned right now.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Daily Pledges */}
      <div
        className={`rounded-xl p-5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sage-600 dark:text-sage-400" />
              <h3 className="text-sm font-semibold tracking-tight">Digital Detox Pledges</h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Personal commitments to screen-free boundaries.
            </p>
          </div>

          <button
            onClick={() => setShowAddPledge(!showAddPledge)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddPledge ? 'Cancel' : 'New'}
          </button>
        </div>

        {showAddPledge && (
          <form onSubmit={handleCreatePledge} className="mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-2 bg-[#FAF9F6] dark:bg-[#121316]">
            <input
              type="text"
              placeholder="Commitment (e.g. No screens after 9:30 PM)"
              value={pledgeTitle}
              onChange={e => setPledgeTitle(e.target.value)}
              className={`w-full px-2.5 py-1.5 text-xs rounded-md border outline-none ${
                isDark ? 'bg-[#191B1F] border-[#282A30] text-white focus:border-sage-500' : 'bg-white border-stone-200 text-stone-900 focus:border-sage-600'
              }`}
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Mins"
                value={pledgeMinutes}
                onChange={e => setPledgeMinutes(e.target.value)}
                className={`w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md border outline-none ${
                  isDark ? 'bg-[#191B1F] border-[#282A30] text-white' : 'bg-white border-stone-200 text-stone-900'
                }`}
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-md cursor-pointer transition-colors shadow-subtle"
              >
                Save Pledge
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5">
          {pledges.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                isDark ? 'bg-[#121316]/50 border-[#282A30]' : 'bg-[#FAF9F6] border-[#EFEFEA]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                <h4 className="text-xs font-medium text-stone-800 dark:text-stone-200">{p.title}</h4>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-stone-400">
                {p.targetMinutes}m target
              </span>
            </div>
          ))}
          {pledges.length === 0 && (
            <p className="text-xs text-stone-400 italic py-2 text-center">No pledges active. Add your first digital detox pledge!</p>
          )}
        </div>
      </div>

      {/* 2. Planned Offline Activities */}
      <div
        className={`rounded-xl p-5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Planned Offline Activities</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Tangible actions to reclaim your mind and presence.
            </p>
          </div>

          <button
            onClick={() => setShowAddAct(!showAddAct)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddAct ? 'Cancel' : 'New'}
          </button>
        </div>

        {showAddAct && (
          <form onSubmit={handleCreateAct} className="mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-2 bg-[#FAF9F6] dark:bg-[#121316]">
            <input
              type="text"
              placeholder="Activity name (e.g. Evening walk in park)"
              value={actTitle}
              onChange={e => setActTitle(e.target.value)}
              className={`w-full px-2.5 py-1.5 text-xs rounded-md border outline-none ${
                isDark ? 'bg-[#191B1F] border-[#282A30] text-white focus:border-sage-500' : 'bg-white border-stone-200 text-stone-900 focus:border-sage-600'
              }`}
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Mins"
                value={actMinutes}
                onChange={e => setActMinutes(e.target.value)}
                className={`w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md border outline-none ${
                  isDark ? 'bg-[#191B1F] border-[#282A30] text-white' : 'bg-white border-stone-200 text-stone-900'
                }`}
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-md cursor-pointer transition-colors shadow-subtle"
              >
                Save Activity
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
          {activities.map(act => (
            <div
              key={act.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                act.completed
                  ? isDark
                    ? 'bg-sage-950/20 border-sage-900/30 text-stone-500 opacity-60'
                    : 'bg-sage-50/40 border-sage-100 text-stone-400 opacity-70'
                  : isDark
                  ? 'bg-[#121316]/50 border-[#282A30]'
                  : 'bg-[#FAF9F6] border-[#EFEFEA]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => onCompleteActivity(act.id)}
                  title={act.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  className="cursor-pointer text-sage-600 hover:text-sage-700 transition-colors"
                >
                  {act.completed ? (
                    <CheckCircle className="w-4 h-4 text-sage-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-300 hover:text-sage-600" />
                  )}
                </button>
                <div className="min-w-0">
                  <h4 className={`text-xs font-medium truncate ${act.completed ? 'line-through' : ''}`}>
                    {act.title}
                  </h4>
                  <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums text-stone-400">
                    <span>{act.durationMinutes}m offline</span>
                    {act.weatherRecommended && (
                      <span className="text-sage-600 dark:text-sage-400 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Weather Match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-xs text-stone-400 italic py-2 text-center">
              No planned activities. Click "+ Plan Activity" under Weather & Discover!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
