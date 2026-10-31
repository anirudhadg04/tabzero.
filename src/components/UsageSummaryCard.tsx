import React from 'react';
import { BarChart3, Globe, ShieldAlert, Info } from 'lucide-react';
import { DomainUsage } from '../types';
import { formatDuration } from '../services/tracker';

interface UsageSummaryCardProps {
  usage: Record<string, DomainUsage>;
  blockedTotal: number;
}

export const UsageSummaryCard: React.FC<UsageSummaryCardProps> = ({ usage, blockedTotal }) => {
  const domains = Object.values(usage).sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds);
  const totalSeconds = domains.reduce((sum, d) => sum + d.timeSpentSeconds, 0);

  // Group by category
  const categoryMap: Record<string, number> = {};
  domains.forEach(d => {
    categoryMap[d.category] = (categoryMap[d.category] || 0) + d.timeSpentSeconds;
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-medium text-slate-900 tracking-tight">
              Website Usage Awareness
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Real active browsing duration tracked directly from your focused browser tabs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Total Active Browsing</span>
            <span className="text-sm font-semibold text-slate-900 font-mono">
              {formatDuration(totalSeconds)}
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-rose-500 block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Deflections
            </span>
            <span className="text-sm font-semibold text-rose-600 font-mono">
              {blockedTotal}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Visited Domains */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Top Visited Domains
          </h4>
          <div className="space-y-2">
            {domains.slice(0, 5).map(item => {
              const pct = totalSeconds > 0 ? Math.round((item.timeSpentSeconds / totalSeconds) * 100) : 0;
              return (
                <div key={item.domain} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.domain}</span>
                    </div>
                    <span className="font-mono text-slate-600 shrink-0 font-medium">
                      {formatDuration(item.timeSpentSeconds)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 rounded-full h-1">
                    <div
                      className="bg-indigo-400 h-1 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {domains.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Browsing time will record as you navigate the web.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Category Breakdown
          </h4>
          <div className="space-y-2.5">
            {categories.map(([cat, secs]) => {
              const pct = totalSeconds > 0 ? Math.round((secs / totalSeconds) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{cat}</span>
                    <span className="text-slate-500 font-mono">
                      {formatDuration(secs)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-700 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                No categorized browsing data yet.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Active tab duration is recorded only when the browser window is focused and non-idle.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
