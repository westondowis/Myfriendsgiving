import React, { useState, useEffect } from 'react';
import { DishItem } from '../types';
import { X, Check, UtensilsCrossed, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClaimModalProps {
  dish: DishItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmClaim: (dishId: string, guestName: string, notes: string, dietary: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  dish,
  isOpen,
  onClose,
  onConfirmClaim,
}) => {
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [dietary, setDietary] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when modal opens or dish changes
  useEffect(() => {
    if (isOpen) {
      setGuestName('');
      setNotes('');
      setDietary('');
      setConfirmed(false);
      setErrorMsg('');
    }
  }, [isOpen, dish]);

  if (!isOpen || !dish) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('Please enter your name so your friends know who is bringing it!');
      return;
    }
    if (!confirmed) {
      setErrorMsg('Please check the confirmation box to lock this dish in.');
      return;
    }

    try {
      onConfirmClaim(dish.id, guestName.trim(), notes.trim(), dietary.trim());

      // Trigger festive autumn celebration confetti
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#C25927', '#D4952B', '#526650', '#8A2B13', '#FAF6F0'],
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to claim dish. It may have just been claimed by someone else.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1E16]/60 backdrop-blur-xs transition-opacity duration-200 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#E8DEC8] shadow-warmLg transform transition-all duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none" role="img" aria-label={dish.name}>
              {dish.emoji}
            </span>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#C25927] block">
                Claiming Dish
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2C1E16] leading-snug">
                {dish.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C7A6E] hover:text-[#2C1E16] hover:bg-[#F2ECE1] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Guest Name (Required) */}
          <div>
            <label
              htmlFor="guestNameInput"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Your Name or Couple/Family <span className="text-[#C25927]">*</span>
            </label>
            <input
              id="guestNameInput"
              type="text"
              required
              autoFocus
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Jessica, Marcus & Maya"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#C25927] focus:border-transparent text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788] font-medium"
            />
          </div>

          {/* Optional Dietary Selection */}
          <div>
            <label
              htmlFor="dietaryInput"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Dietary Profile (Optional)
            </label>
            <input
              id="dietaryInput"
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. Vegetarian, Gluten-Free, Nut-Free, Dairy-Free"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#C25927] text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788]"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="dishNotesInput"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Prep Notes (Optional)
            </label>
            <input
              id="dishNotesInput"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Will bring in a slow cooker, serving spoon included"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#C25927] text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788]"
            />
          </div>

          {/* Step 2: Confirmation Checkbox (Required) */}
          <div className="p-3.5 bg-[#FAF3EC] rounded-2xl border border-[#F0DFCF]">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  if (errorMsg) setErrorMsg('');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#C25927] focus:ring-[#C25927] border-[#C8B6A5] accent-[#C25927]"
              />
              <span className="text-xs text-[#2C1E16] leading-relaxed font-medium">
                I solemnly swear I am bringing this dish and will feed the feast!
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 min-h-[44px] py-2.5 rounded-xl border border-[#D9CEBF] text-[#4A3B32] font-semibold text-xs sm:text-sm hover:bg-[#F3EDE2] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 min-h-[44px] py-2.5 rounded-xl bg-[#C25927] hover:bg-[#A6471B] text-white font-semibold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>Lock It In 🦃</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
