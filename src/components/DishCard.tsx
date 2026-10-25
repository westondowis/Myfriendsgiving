import React from 'react';
import { DishItem } from '../types';
import { Lock, Check, Trash2, Clock } from 'lucide-react';

interface DishCardProps {
  dish: DishItem;
  onOpenClaim: (dish: DishItem) => void;
  onRequestUnclaim: (dish: DishItem) => void;
  onRemoveCustom?: (id: string) => void;
  isHost?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  onOpenClaim,
  onRequestUnclaim,
  onRemoveCustom,
  isHost = false,
}) => {
  const isClaimed = !!dish.claimedBy;

  const formattedClaimTime = React.useMemo(() => {
    if (!dish.claimedAt) return '';
    try {
      const d = new Date(dish.claimedAt);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [dish.claimedAt]);

  const categoryName = React.useMemo(() => {
    switch (dish.cuisineCategory) {
      case 'mains': return 'Main Protein';
      case 'sides': return 'Side Dish';
      case 'breads': return 'Breads & Rolls';
      case 'desserts': return 'Dessert / Pie';
      case 'drinks': return 'Beverages';
      case 'appetizers': return 'Appetizer';
      case 'supplies': return 'Paper & Ice';
      default: return 'Feast Item';
    }
  }, [dish.cuisineCategory]);

  if (isClaimed) {
    return (
      <div className="group relative bg-[#F7F3EC] rounded-2xl p-4 sm:p-5 border border-[#E3D8C8] shadow-2xs flex flex-col justify-between transition-all hover:border-[#D6C7B3]">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-2xl sm:text-3xl select-none shrink-0" role="img" aria-label={dish.name}>
                {dish.emoji || '🍽️'}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-[#4A3B32] text-base sm:text-lg leading-snug line-through opacity-85 break-words">
                  {dish.name}
                </h3>
                {/* Clean unboxed metadata with separators */}
                <div className="mt-1 flex items-center gap-2 text-xs text-[#526650] font-semibold flex-wrap">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#526650] shrink-0" />
                    <span>Brought by <strong>{dish.claimedBy}</strong></span>
                  </span>
                  <span aria-hidden="true" className="text-[#C7BBAE]">·</span>
                  <span className="text-[#705F55] font-normal">{categoryName}</span>
                </div>
              </div>
            </div>

            {/* Locked Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E8E1D5] text-[#4A3B32] shrink-0 border border-[#DACFBF]">
              <Lock className="w-3 h-3 text-[#705F55]" />
              <span>Locked</span>
            </div>
          </div>

          {/* Optional notes callout */}
          {dish.notes && (
            <div className="mt-3 text-xs bg-white/70 p-2.5 rounded-xl border border-[#E6DDCE] text-[#4A3B32] italic">
              “{dish.notes}”
            </div>
          )}

          {dish.dietary && (
            <div className="mt-2 text-[11px] font-medium text-[#705F55]">
              Dietary Note: <span className="text-[#2C1E16]">{dish.dietary}</span>
            </div>
          )}
        </div>

        {/* Footer info & Unclaim trigger */}
        <div className="mt-4 pt-2.5 border-t border-[#E8DEC8] flex items-center justify-between text-[11px] text-[#705F55]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#A69788]" />
            <span>Claimed {formattedClaimTime}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestUnclaim(dish);
              }}
              className="relative z-10 text-[#705F55] hover:text-[#B91C1C] underline underline-offset-2 transition-colors px-2 min-h-[40px] flex items-center text-xs font-semibold cursor-pointer active:scale-95 touch-manipulation"
              title={isHost ? 'Host Override: Tap to release dish immediately' : 'Click if you need to release this dish claim'}
            >
              {isHost ? 'Release (Host)' : 'Need to swap?'}
            </button>
            {dish.category === 'custom' && onRemoveCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCustom(dish.id);
                }}
                className="relative z-10 text-stone-400 hover:text-red-600 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title="Delete this custom entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Unclaimed State
  return (
    <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DEC8] hover:border-[#C25927]/40 shadow-xs hover:shadow-warm flex flex-col justify-between transition-all transform hover:-translate-y-0.5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl select-none group-hover:scale-105 transition-transform shrink-0" role="img" aria-label={dish.name}>
              {dish.emoji || '🥘'}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-[#2C1E16] text-base sm:text-lg leading-snug break-words">
                {dish.name}
              </h3>
              {/* Unboxed metadata */}
              <div className="mt-1 flex items-center gap-2 text-xs text-[#705F55]">
                <span>{categoryName}</span>
                <span aria-hidden="true" className="text-[#D8CEBE]">·</span>
                <span className="text-[#C25927] font-semibold">Still needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#F4EFE6] flex items-center justify-between">
        <span className="text-[11px] text-[#A69788]">
          Open slot
        </span>
        <button
          type="button"
          onClick={() => onOpenClaim(dish)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C25927] hover:bg-[#A6471B] text-white text-xs sm:text-sm font-semibold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>Claim This</span>
          <span role="img" aria-label="Check">✨</span>
        </button>
      </div>
    </div>
  );
};
