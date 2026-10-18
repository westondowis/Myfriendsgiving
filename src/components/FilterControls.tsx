import React from 'react';
import { FilterStatus, CategoryFilter, CuisineCategory } from '../types';
import { Search, X } from 'lucide-react';

interface FilterControlsProps {
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (category: CategoryFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    needed: number;
    claimed: number;
  };
}

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Dishes' },
  { id: 'mains', label: 'Main Proteins' },
  { id: 'sides', label: 'Sides' },
  { id: 'breads', label: 'Breads & Rolls' },
  { id: 'desserts', label: 'Pies & Sweets' },
  { id: 'drinks', label: 'Beverages' },
  { id: 'appetizers', label: 'Starters' },
  { id: 'supplies', label: 'Supplies' },
];

export const FilterControls: React.FC<FilterControlsProps> = ({
  filterStatus,
  onFilterStatusChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="space-y-3 mb-6 no-print">
      {/* Top row: Status Segmented Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Button Group (Functional interactive tabs) */}
        <div className="inline-flex p-1 bg-[#EFE8DC] rounded-xl border border-[#E2D7C5] self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onFilterStatusChange('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
              filterStatus === 'all'
                ? 'bg-[#2C1E16] text-white shadow-xs'
                : 'text-[#4A3B32] hover:text-[#2C1E16] hover:bg-white/50'
            }`}
          >
            <span>All Menu</span>
            <span className="tabular-nums opacity-75">({counts.all})</span>
          </button>

          <button
            onClick={() => onFilterStatusChange('needed')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
              filterStatus === 'needed'
                ? 'bg-[#2C1E16] text-white shadow-xs'
                : 'text-[#4A3B32] hover:text-[#2C1E16] hover:bg-white/50'
            }`}
          >
            <span>Still Needed</span>
            <span className="tabular-nums opacity-75">({counts.needed})</span>
          </button>

          <button
            onClick={() => onFilterStatusChange('claimed')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
              filterStatus === 'claimed'
                ? 'bg-[#2C1E16] text-white shadow-xs'
                : 'text-[#4A3B32] hover:text-[#2C1E16] hover:bg-white/50'
            }`}
          >
            <span>Locked In</span>
            <span className="tabular-nums opacity-75">({counts.claimed})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dish or guest..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#C25927] focus:border-transparent text-xs sm:text-sm text-[#2C1E16] placeholder-[#A69788]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7A6E] hover:text-[#2C1E16] p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category scroll list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryFilterChange(cat.id)}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors font-medium ${
              categoryFilter === cat.id
                ? 'bg-[#C25927] text-white'
                : 'bg-white border border-[#E5DAC8] text-[#5C4A3E] hover:border-[#C25927]/40 hover:text-[#2C1E16]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
