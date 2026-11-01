import React, { useState } from 'react';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { RestrictedSite } from '../types';
import { extractRootDomain } from '../blocking/rules';

interface RestrictedSitesCardProps {
  sites: RestrictedSite[];
  onAddSite: (domain: string) => void;
  onRemoveSite: (id: string) => void;
  onToggleSite: (id: string) => void;
  compact?: boolean;
  isDark?: boolean;
}

export const RestrictedSitesCard: React.FC<RestrictedSitesCardProps> = ({
  sites,
  onAddSite,
  onRemoveSite,
  onToggleSite,
  compact = false,
  isDark = false,
}) => {
  const [newDomain, setNewDomain] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const clean = extractRootDomain(newDomain.trim());
    onAddSite(clean);
    setNewDomain('');
  };

  const activeCount = sites.filter(s => s.enabled).length;

  if (compact) {
    return (
      <div
        className={`rounded-xl p-3.5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Restricted Sites
            </h4>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-stone-400">
            {activeCount}/{sites.length} active
          </span>
        </div>

        {/* Compact Add Form */}
        <form onSubmit={handleAdd} className="flex gap-1.5 mb-2.5">
          <input
            type="text"
            placeholder="e.g. reddit.com"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            className={`flex-1 px-2.5 py-1 text-xs rounded-md border outline-none transition-colors ${
              isDark
                ? 'bg-[#121316] border-[#282A30] text-white placeholder-stone-500 focus:border-sage-500'
                : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 placeholder-stone-400 focus:border-sage-600'
            }`}
          />
          <button
            type="submit"
            className="px-2 py-1 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-md cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Sites List */}
        <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
          {sites.map(site => (
            <div
              key={site.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded-md border text-xs transition-colors ${
                isDark
                  ? 'bg-[#121316]/60 border-[#282A30]/60'
                  : 'bg-[#FAF9F6] border-[#F0EFEA]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={site.enabled}
                  onChange={() => onToggleSite(site.id)}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-sage-600 focus:ring-0 cursor-pointer accent-sage-600"
                />
                <span
                  className={`truncate ${
                    site.enabled
                      ? isDark ? 'text-stone-200' : 'text-stone-800'
                      : 'text-stone-400 line-through'
                  }`}
                >
                  {site.domain}
                </span>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => onRemoveSite(site.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {sites.length === 0 && (
            <p className="text-xs text-stone-400 italic py-1 text-center">No restricted sites configured.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-5 border transition-colors ${
        isDark
          ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
          : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h3 className="text-sm font-semibold tracking-tight">Restricted Websites</h3>
            <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded bg-sage-50 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300 border border-sage-200/60 dark:border-sage-800/50">
              {activeCount}/{sites.length} Active
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Redirected to peaceful nature during active focus sessions.
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. reddit.com"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
              isDark
                ? 'bg-[#121316] border-[#282A30] text-white placeholder-stone-500 focus:border-sage-500'
                : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 placeholder-stone-400 focus:border-sage-600'
            }`}
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {sites.map(site => (
          <div
            key={site.id}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              site.enabled
                ? isDark
                  ? 'bg-[#121316]/50 border-[#282A30]'
                  : 'bg-[#FAF9F6] border-[#EFEFEA]'
                : isDark
                ? 'bg-[#121316]/20 border-[#282A30]/40 opacity-50'
                : 'bg-[#F7F6F2] border-[#EAE9E4] opacity-50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={site.enabled}
                onChange={() => onToggleSite(site.id)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-sage-600 focus:ring-0 cursor-pointer accent-sage-600"
              />
              <span
                className={`text-xs font-medium truncate ${
                  site.enabled ? (isDark ? 'text-stone-200' : 'text-stone-800') : 'text-stone-400 line-through'
                }`}
              >
                {site.domain}
              </span>
            </div>

            <button
              onClick={() => onRemoveSite(site.id)}
              className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remove website"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
