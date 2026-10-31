import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { HistoryState } from '../types';

interface HistoryControlsProps {
  history: HistoryState;
  onUndo: () => void;
  onRedo: () => void;
  compact?: boolean;
}

export const HistoryControls: React.FC<HistoryControlsProps> = ({
  history,
  onUndo,
  onRedo,
  compact = false,
}) => {
  const undoCount = history.past.length;
  const redoCount = history.future.length;
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={`Undo last action (${undoCount}/5 available)`}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            canUndo
              ? 'bg-white text-slate-800 shadow-sm hover:bg-slate-50 cursor-pointer'
              : 'text-slate-400 cursor-not-allowed opacity-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{undoCount}</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title={`Redo action (${redoCount}/5 available)`}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            canRedo
              ? 'bg-white text-slate-800 shadow-sm hover:bg-slate-50 cursor-pointer'
              : 'text-slate-400 cursor-not-allowed opacity-50'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{redoCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-subtle">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            canUndo
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer active:scale-95'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              canUndo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/50 text-slate-400'
            }`}
          >
            {undoCount}/5
          </span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            canRedo
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer active:scale-95'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Redo</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              canRedo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/50 text-slate-400'
            }`}
          >
            {redoCount}/5
          </span>
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-3">
        <span className="text-[11px] text-slate-400">5-step reversible memory</span>
      </div>
    </div>
  );
};
