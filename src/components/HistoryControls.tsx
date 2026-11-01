import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { HistoryState } from '../types';

interface HistoryControlsProps {
  history: HistoryState;
  onUndo: () => void;
  onRedo: () => void;
  compact?: boolean;
  isDark?: boolean;
}

export const HistoryControls: React.FC<HistoryControlsProps> = ({
  history,
  onUndo,
  onRedo,
  compact = false,
  isDark = false,
}) => {
  const undoCount = history.past.length;
  const redoCount = history.future.length;
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30]'
            : 'bg-[#F2F1ED] border-[#E5E4DF]'
        }`}
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={`Undo last action (${undoCount}/5 available)`}
          className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
            canUndo
              ? isDark
                ? 'text-[#EDEDEB] hover:bg-[#23262C]'
                : 'text-[#1A1C1E] hover:bg-[#FFFFFF] shadow-subtle'
              : 'text-stone-400 opacity-40 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span className="font-mono text-[10px] tabular-nums">{undoCount}</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title={`Redo action (${redoCount}/5 available)`}
          className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
            canRedo
              ? isDark
                ? 'text-[#EDEDEB] hover:bg-[#23262C]'
                : 'text-[#1A1C1E] hover:bg-[#FFFFFF] shadow-subtle'
              : 'text-stone-400 opacity-40 cursor-not-allowed'
          }`}
        >
          <RotateCw className="w-3 h-3" />
          <span className="font-mono text-[10px] tabular-nums">{redoCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
        isDark
          ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
          : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            canUndo
              ? isDark
                ? 'bg-[#23262C] hover:bg-[#2E3138] text-[#EDEDEB] cursor-pointer'
                : 'bg-[#F4F3EF] hover:bg-[#EAE8E2] text-[#1A1C1E] cursor-pointer'
              : 'text-stone-400 opacity-40 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Undo</span>
          <span className="font-mono text-[10px] tabular-nums opacity-70">
            {undoCount}/5
          </span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            canRedo
              ? isDark
                ? 'bg-[#23262C] hover:bg-[#2E3138] text-[#EDEDEB] cursor-pointer'
                : 'bg-[#F4F3EF] hover:bg-[#EAE8E2] text-[#1A1C1E] cursor-pointer'
              : 'text-stone-400 opacity-40 cursor-not-allowed'
          }`}
        >
          <RotateCw className="w-3 h-3" />
          <span>Redo</span>
          <span className="font-mono text-[10px] tabular-nums opacity-70">
            {redoCount}/5
          </span>
        </button>
      </div>

      <span className="hidden sm:inline-block font-mono text-[11px] text-stone-400 border-l border-stone-200 dark:border-stone-700/60 pl-2">
        5-step undo
      </span>
    </div>
  );
};
