import React, { useState } from 'react';
import { CuisineCategory } from '../types';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomDish: (params: {
    name: string;
    guestName: string;
    notes?: string;
    cuisineCategory: CuisineCategory;
    emoji: string;
    dietary?: string;
  }) => void;
}

const CATEGORY_OPTIONS: { id: CuisineCategory; label: string; defaultEmoji: string }[] = [
  { id: 'sides', label: 'Side Dish (e.g. Cornbread, Gratin)', defaultEmoji: '🌽' },
  { id: 'appetizers', label: 'Appetizer / Starter (e.g. Dips, Brie)', defaultEmoji: '🧀' },
  { id: 'desserts', label: 'Dessert / Pie (e.g. Pecan Tart, Cookies)', defaultEmoji: '🥧' },
  { id: 'drinks', label: 'Beverages (e.g. Mulled Wine, Cider)', defaultEmoji: '🍷' },
  { id: 'breads', label: 'Breads & Biscuits', defaultEmoji: '🍞' },
  { id: 'mains', label: 'Main Dish Variant (e.g. Ham, Vegan Roast)', defaultEmoji: '🍖' },
  { id: 'supplies', label: 'Party Supplies & Essentials', defaultEmoji: '✨' },
];

export const CustomDishModal: React.FC<CustomDishModalProps> = ({
  isOpen,
  onClose,
  onAddCustomDish,
}) => {
  const [name, setName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [category, setCategory] = useState<CuisineCategory>('sides');
  const [emoji, setEmoji] = useState('🥧');
  const [notes, setNotes] = useState('');
  const [dietary, setDietary] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (cat: CuisineCategory) => {
    setCategory(cat);
    const found = CATEGORY_OPTIONS.find((c) => c.id === cat);
    if (found) {
      setEmoji(found.defaultEmoji);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify what delicious dish or item you are bringing!');
      return;
    }
    if (!guestName.trim()) {
      setErrorMsg('Please enter your name so everyone knows who to thank!');
      return;
    }
    if (!confirmed) {
      setErrorMsg('Please check the confirmation box before submitting.');
      return;
    }

    onAddCustomDish({
      name: name.trim(),
      guestName: guestName.trim(),
      notes: notes.trim(),
      cuisineCategory: category,
      emoji: emoji.trim() || '🥧',
      dietary: dietary.trim(),
    });

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#526650', '#C25927', '#D4952B', '#FAF6F0'],
      });
    }

    onClose();
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
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#526650] block">
              Wildcard Addition
            </span>
            <h3 className="font-serif text-xl font-bold text-[#2C1E16] leading-snug">
              Bring Something Else
            </h3>
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
          {/* Dish Name */}
          <div>
            <label
              htmlFor="customDishName"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Dish or Item Title <span className="text-[#C25927]">*</span>
            </label>
            <input
              id="customDishName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Homemade Jalapeño Cornbread, Mulled Cider"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#526650] text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788] font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="customCategory"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Category
            </label>
            <select
              id="customCategory"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as CuisineCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#526650] text-sm bg-[#FAF8F5] text-[#2C1E16] font-medium"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.defaultEmoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Guest Name */}
          <div>
            <label
              htmlFor="customGuest"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Your Name <span className="text-[#C25927]">*</span>
            </label>
            <input
              id="customGuest"
              type="text"
              required
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Sam & Taylor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#526650] text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788] font-medium"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="customNotes"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Notes or Dietary Specs (Optional)
            </label>
            <input
              id="customNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Gluten-free, vegetarian, serving 8-10 people"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#526650] text-sm bg-[#FAF8F5] text-[#2C1E16] placeholder-[#A69788]"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="p-3.5 bg-[#EBF0EA] rounded-2xl border border-[#D0DDD0]">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  if (errorMsg) setErrorMsg('');
                }}
                className="mt-0.5 h-4 w-4 rounded text-[#526650] focus:ring-[#526650] border-[#9AB499] accent-[#526650]"
              />
              <span className="text-xs text-[#2C1E16] leading-relaxed font-medium">
                I confirm I am bringing this dish and will have it hot & ready for the feast!
              </span>
            </label>
          </div>

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
              className="w-2/3 min-h-[44px] py-2.5 rounded-xl bg-[#526650] hover:bg-[#3D4D3B] text-white font-semibold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>Add to Ledger 🥧</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
