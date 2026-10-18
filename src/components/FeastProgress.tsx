import React from 'react';
import { FeastStats } from '../types';
import { Sparkles, Utensils, CheckCircle2 } from 'lucide-react';

interface FeastProgressProps {
  stats: FeastStats;
}

export const FeastProgress: React.FC<FeastProgressProps> = ({ stats }) => {
  const { totalCore, claimedCore, totalCustom, neededTotal, percentCore } = stats;

  let statusMessage = 'Gathering the chefs...';
  let statusTone = 'text-[#D4952B] bg-[#FCF5E8] border-[#EBD6B0]';

  if (percentCore === 100) {
    statusMessage = '🎉 All Core Dishes Secured!';
    statusTone = 'text-emerald-800 bg-emerald-50 border-emerald-200';
  } else if (percentCore >= 60) {
    statusMessage = '🔥 Feast taking hearty shape!';
    statusTone = 'text-[#C25927] bg-[#F7EDE6] border-[#F0D5C3]';
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DEC8] shadow-xs mb-8 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#705F55] block mb-1">
            The Feast Progress
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#2C1E16] flex items-baseline gap-1.5 flex-wrap">
            <span className="tabular-nums text-2xl sm:text-3xl text-[#C25927]">
              {claimedCore}
            </span>
            <span className="text-[#705F55] font-sans font-normal text-sm">of</span>
            <span className="tabular-nums text-2xl sm:text-3xl text-[#2C1E16]">
              {totalCore}
            </span>
            <span className="text-[#2C1E16] text-base font-sans font-semibold ml-1">
              core dishes claimed
            </span>
          </div>
        </div>

        <div className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold border ${statusTone} flex items-center gap-1.5`}>
          {percentCore === 100 ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-[#F3EDE2] rounded-full h-3 overflow-hidden p-0.5 border border-[#EAE0D1]">
        <div
          className="h-full bg-gradient-to-r from-[#C25927] via-[#D4952B] to-[#526650] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percentCore))}%` }}
        />
      </div>

      {/* Metric details row */}
      <div className="mt-3.5 pt-3 border-t border-[#F2ECE1] flex items-center justify-between text-xs text-[#705F55] flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-[#2C1E16] tabular-nums font-semibold">{percentCore}%</strong> completed
          </span>
          <span aria-hidden="true" className="text-[#D8CEBE]">·</span>
          <span>
            <strong className="text-[#2C1E16] tabular-nums font-semibold">{neededTotal}</strong> slots still needed
          </span>
          {totalCustom > 0 && (
            <>
              <span aria-hidden="true" className="text-[#D8CEBE]">·</span>
              <span>
                <strong className="text-[#526650] tabular-nums font-semibold">+{totalCustom}</strong> extra goodies added
              </span>
            </>
          )}
        </div>

        <span className="text-[11px] text-[#A69788]">
          Updates live across all screens
        </span>
      </div>
    </div>
  );
};
