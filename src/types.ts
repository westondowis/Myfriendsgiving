export type CuisineCategory =
  | 'mains'
  | 'sides'
  | 'breads'
  | 'desserts'
  | 'drinks'
  | 'appetizers'
  | 'supplies';

export interface DishItem {
  id: string;
  name: string;
  category: 'core' | 'custom';
  cuisineCategory: CuisineCategory;
  emoji: string;
  claimedBy: string | null;
  claimedAt: string | null; // ISO Date string
  notes?: string;
  dietary?: string;
}

export type FilterStatus = 'all' | 'needed' | 'claimed';
export type CategoryFilter = 'all' | CuisineCategory;

export interface FeastStats {
  totalCore: number;
  claimedCore: number;
  totalCustom: number;
  totalDishes: number;
  neededTotal: number;
  percentCore: number;
}
