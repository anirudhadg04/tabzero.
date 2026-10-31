import React, { useState } from 'react';
import { Plus, Trash2, Shield, Globe, ShieldAlert } from 'lucide-react';
import { RestrictedSite } from '../types';
import { cleanDomain } from '../blocking/rules';

interface RestrictedSitesCardProps {
  sites: RestrictedSite[];
  onAddSite: (domain: string, category?: RestrictedSite['category']) => void;
  onRemoveSite: (id: string) => void;
  onToggleSite: (id: string) => void;
  compact?: boolean;
  isDark?: boolean;
}

const COMMON_SUGGESTIONS = [
  { domain: 'instagram.com', category: 'social' as const },
  { domain: 'youtube.com', category: 'entertainment' as const },
  { domain: 'x.com', category: 'social' as const },
  { domain: 'reddit.com', category: 'forums' as const },
  { domain: 'tiktok.com', category: 'social' as const },
  { domain: 'netflix.com', category: 'entertainment' as const },
];

export const RestrictedSitesCard: React.FC<RestrictedSitesCardProps> = ({
  sites,
  onAddSite,
  onRemoveSite,
  onToggleSite,
  compact = false,
  isDark = false,
}) => {
  const [newDomain, setNewDomain] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RestrictedSite['category']>('social');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = cleanDomain(newDomain);
    if (!cleaned) return;
    onAddSite(cleaned, selectedCategory);
    setNewDomain('');
  };

  const enabledCount = sites.filter(s => s.enabled).length;
  const totalBlockedAttempts = sites.reduce((sum, s) => sum + s.blockedCount, 0);

  if (compact) {
    return (
      <div
        className={`rounded-2xl p-4 border transition-colors duration-300 ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Restricted Websites
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {enabledCount}/{sites.length} Active
          </span>
        </div>

        <form onSubmit={handleAdd} className="flex gap-1.5 mb-3">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="e.g. reddit.com"
            className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg outline-none border focus:border-indigo-400 transition-all ${
              isDark
                ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              isDark
                ? 'bg-white hover:bg-slate-100 text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {sites.map(site => (
            <div
              key={site.id}
              className={`flex items-center justify-between p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80'
                  : 'bg-slate-50/60 hover:bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={site.enabled}
                  onChange={() => onToggleSite(site.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span
                  className={`text-xs truncate ${
                    site.enabled
                      ? isDark ? 'text-slate-200' : 'text-slate-800'
                      : 'text-slate-500 line-through'
                  }`}
                >
                  {site.domain}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {site.blockedCount > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isDark
                        ? 'text-rose-400 bg-rose-950/60 border border-rose-900/40'
                        : 'text-rose-500 bg-rose-50'
                    }`}
                  >
                    {site.blockedCount} blocked
                  </span>
                )}
                <button
                  onClick={() => onRemoveSite(site.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-medium text-slate-900 tracking-tight">
              Website Restrictions
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Domains restricted during active detox sessions. Blocks root domains, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-semibold">www.</code> and all subdomains (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-semibold">*.domain</code>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs text-slate-600 font-medium">
              <strong className="text-slate-900 font-semibold">{totalBlockedAttempts}</strong> attempts deflected
            </span>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <span className="text-slate-900 font-semibold">{enabledCount}</span> of {sites.length} active
          </div>
        </div>
      </div>

      {/* Add Domain Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="Add website (e.g. twitter.com, reddit.com)"
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as RestrictedSite['category'])}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-slate-700"
        >
          <option value="social">Social Media</option>
          <option value="entertainment">Entertainment</option>
          <option value="forums">Forums & Feeds</option>
          <option value="custom">Custom</option>
        </select>

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all shadow-subtle shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Website
        </button>
      </form>

      {/* Quick suggestions pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        <span className="text-[11px] text-slate-400 mr-1">Quick add:</span>
        {COMMON_SUGGESTIONS.map(item => {
          const alreadyAdded = sites.some(s => cleanDomain(s.domain) === cleanDomain(item.domain));
          return (
            <button
              key={item.domain}
              type="button"
              disabled={alreadyAdded}
              onClick={() => onAddSite(item.domain, item.category)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                alreadyAdded
                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-default'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 cursor-pointer hover:border-slate-300'
              }`}
            >
              + {item.domain}
            </button>
          );
        })}
      </div>

      {/* List of Sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {sites.map(site => (
          <div
            key={site.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              site.enabled
                ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                : 'bg-slate-50/70 border-slate-100 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={site.enabled}
                onChange={() => onToggleSite(site.id)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium truncate ${
                      site.enabled ? 'text-slate-800' : 'text-slate-400 line-through'
                    }`}
                  >
                    {site.domain}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {site.category}
                  </span>
                </div>
                {site.blockedCount > 0 && (
                  <p className="text-[11px] text-rose-500 font-medium mt-0.5">
                    {site.blockedCount} navigation attempt{site.blockedCount > 1 ? 's' : ''} redirected
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onRemoveSite(site.id)}
              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remove website"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
