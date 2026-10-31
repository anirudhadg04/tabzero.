import React, { useState } from 'react';
import { Target, Plus, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { OfflineActivity, PillarType, Pledge } from '../types';
import { PillarBadge } from './PillarBadge';

interface PledgesCardProps {
  pledges: Pledge[];
  activities: OfflineActivity[];
  onCreatePledge: (pledge: Omit<Pledge, 'id' | 'createdAt'>) => void;
  onAddActivity: (activity: Omit<OfflineActivity, 'id' | 'createdAt'>) => void;
  onCompleteActivity: (id: string) => void;
  compact?: boolean;
}

export const PledgesCard: React.FC<PledgesCardProps> = ({
  pledges,
  activities,
  onCreatePledge,
  onAddActivity,
  onCompleteActivity,
  compact = false,
}) => {
  const [showAddPledge, setShowAddPledge] = useState(false);
  const [pledgeTitle, setPledgeTitle] = useState('');
  const [pledgePillar, setPledgePillar] = useState<PillarType>('DISCONNECT');
  const [pledgeMinutes, setPledgeMinutes] = useState('45');

  const [showAddAct, setShowAddAct] = useState(false);
  const [actTitle, setActTitle] = useState('');
  const [actPillar, setActPillar] = useState<PillarType>('MOVE');
  const [actMinutes, setActMinutes] = useState('30');

  const handleCreatePledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeTitle.trim()) return;
    onCreatePledge({
      title: pledgeTitle.trim(),
      pillar: pledgePillar,
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
      pillar: actPillar,
      durationMinutes: parseInt(actMinutes, 10) || 30,
      completed: false,
    });
    setActTitle('');
    setShowAddAct(false);
  };

  if (compact) {
    const pendingActivities = activities.filter(a => !a.completed);
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
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
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
            >
              <span className="truncate pr-2 text-slate-700">{act.title}</span>
              <button
                onClick={() => onCompleteActivity(act.id)}
                className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-medium text-slate-900 tracking-tight">
                Digital Detox Pledges
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Personal commitments to screen-free boundaries.
            </p>
          </div>

          <button
            onClick={() => setShowAddPledge(!showAddPledge)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddPledge ? 'Close' : 'New Pledge'}
          </button>
        </div>

        {showAddPledge && (
          <form onSubmit={handleCreatePledge} className="mb-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <input
              type="text"
              placeholder="Commitment (e.g. No screens after 9:30 PM)"
              value={pledgeTitle}
              onChange={e => setPledgeTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 text-slate-800"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={pledgePillar}
                onChange={e => setPledgePillar(e.target.value as PillarType)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
              >
                <option value="MOVE">MOVE</option>
                <option value="DISCONNECT">DISCONNECT</option>
                <option value="RECONNECT">RECONNECT</option>
              </select>
              <input
                type="number"
                placeholder="Mins"
                value={pledgeMinutes}
                onChange={e => setPledgeMinutes(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-800"
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
              >
                Create Pledge
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {pledges.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                  <span className="text-[11px] text-slate-400">{p.targetMinutes}m target</span>
                </div>
              </div>
              <PillarBadge pillar={p.pillar} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Planned Offline Activities */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium text-slate-900 tracking-tight">
                Planned Offline Activities
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Tangible actions to reclaim your mind and body.
            </p>
          </div>

          <button
            onClick={() => setShowAddAct(!showAddAct)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {showAddAct ? 'Close' : 'Add Activity'}
          </button>
        </div>

        {showAddAct && (
          <form onSubmit={handleCreateAct} className="mb-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <input
              type="text"
              placeholder="Activity name (e.g. Evening cycling with music)"
              value={actTitle}
              onChange={e => setActTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 text-slate-800"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={actPillar}
                onChange={e => setActPillar(e.target.value as PillarType)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
              >
                <option value="MOVE">MOVE</option>
                <option value="DISCONNECT">DISCONNECT</option>
                <option value="RECONNECT">RECONNECT</option>
              </select>
              <input
                type="number"
                placeholder="Mins"
                value={actMinutes}
                onChange={e => setActMinutes(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-800"
              />
              <button
                type="submit"
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
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
                  ? 'bg-emerald-50/40 border-emerald-100 text-slate-400'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onCompleteActivity(act.id)}
                  disabled={act.completed}
                  className="cursor-pointer"
                >
                  {act.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 hover:text-emerald-500 transition-colors" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      act.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {act.title}
                  </p>
                  <span className="text-[11px] text-slate-400">{act.durationMinutes} mins</span>
                </div>
              </div>

              <PillarBadge pillar={act.pillar} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
