/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFeastLedger } from './hooks/useFeastLedger';
import { DishItem, FilterStatus, CategoryFilter, HostUser } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeastProgress } from './components/FeastProgress';
import { FilterControls } from './components/FilterControls';
import { DishCard } from './components/DishCard';
import { ClaimModal } from './components/ClaimModal';
import { CustomDishModal } from './components/CustomDishModal';
import { ConfigModal } from './components/ConfigModal';
import { CreateFeastModal } from './components/CreateFeastModal';
import { PrintView } from './components/PrintView';
import { Toast } from './components/Toast';
import { Plus, SearchX, ChefHat } from 'lucide-react';

export default function App() {
  const {
    activePotluckId,
    feastMeta,
    dishes,
    stats,
    syncStatus,
    firebaseUrl,
    createFeast,
    claimDish,
    unclaimDish,
    addCustomDish,
    removeCustomDish,
    resetToDefaults,
    updateFirebaseConfig,
  } = useFeastLedger();

  // Host state
  const [currentUser, setCurrentUser] = useState<HostUser | null>(() => {
    try {
      const saved = localStorage.getItem('friendsgiving_host_user');
      if (saved) return JSON.parse(saved);
      const hostName = localStorage.getItem('friendsgiving_host_name');
      if (hostName) {
        return {
          name: hostName.includes('@') ? hostName.split('@')[0] : hostName,
          email: hostName.includes('@') ? hostName : `${hostName}@friendsgiving.app`,
          uid: `host-${hostName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        };
      }
    } catch {}
    return null;
  });

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [activeClaimDish, setActiveClaimDish] = useState<DishItem | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCreateFeastOpen, setIsCreateFeastOpen] = useState(false);

  // Toast
  const [toastInfo, setToastInfo] = useState<{ message: string; icon: string; visible: boolean }>({
    message: '',
    icon: '🍂',
    visible: false,
  });

  const showToast = (message: string, icon = '🍂') => {
    setToastInfo({ message, icon, visible: true });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 3800);
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      // Status filter
      if (filterStatus === 'needed' && dish.claimedBy) return false;
      if (filterStatus === 'claimed' && !dish.claimedBy) return false;

      // Category filter
      if (categoryFilter !== 'all' && dish.cuisineCategory !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesGuest = dish.claimedBy?.toLowerCase().includes(q);
        const matchesNotes = dish.notes?.toLowerCase().includes(q);
        const matchesDietary = dish.dietary?.toLowerCase().includes(q);
        if (!matchesName && !matchesGuest && !matchesNotes && !matchesDietary) return false;
      }

      return true;
    });
  }, [dishes, filterStatus, categoryFilter, searchQuery]);

  const coreDishes = useMemo(() => {
    return filteredDishes.filter((d) => d.category === 'core');
  }, [filteredDishes]);

  const customDishes = useMemo(() => {
    return filteredDishes.filter((d) => d.category === 'custom');
  }, [filteredDishes]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const all = dishes.length;
    const needed = dishes.filter((d) => !d.claimedBy).length;
    const claimed = dishes.filter((d) => !!d.claimedBy).length;
    return { all, needed, claimed };
  }, [dishes]);

  // Handlers
  const handleOpenClaim = (dish: DishItem) => {
    setActiveClaimDish(dish);
  };

  const handleConfirmClaim = (dishId: string, guestName: string, notes: string, dietary: string) => {
    claimDish(dishId, guestName, notes, dietary);
    const dish = dishes.find((d) => d.id === dishId);
    showToast(`${guestName} is bringing ${dish?.name || 'this dish'}!`, '🎉');
  };

  // Direct, clean unclaim without window.confirm blocking
  const handleRequestUnclaim = (dish: DishItem) => {
    unclaimDish(dish.id);
    showToast(`"${dish.name}" is now open for claiming!`, '✨');
  };

  // Direct, clean remove custom dish
  const handleRemoveCustom = (id: string) => {
    const dish = dishes.find((d) => d.id === id);
    removeCustomDish(id);
    showToast(`Removed "${dish?.name || 'dish'}"`, '🗑️');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?potluck=${encodeURIComponent(activePotluckId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Potluck guest link copied! Send it to your friends (no login needed) 🦃', '📋');
    } else {
      window.prompt('Copy this guest link to share with friends:', shareUrl);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF6F0] text-[#2C1E16] selection:bg-[#F4DFC8] selection:text-[#9A3412]">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}!`, '🍁');
        }}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('friendsgiving_host_user');
          localStorage.removeItem('friendsgiving_host_name');
          showToast('Signed out of Host mode', '👋');
        }}
        onOpenCreateFeast={() => setIsCreateFeastOpen(true)}
        activeFeastTitle={feastMeta.title}
        syncMode={syncStatus.mode}
        syncLabel={syncStatus.label}
        isConnected={syncStatus.connected}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onShare={handleShare}
        onPrint={handlePrint}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <HeroSection meta={feastMeta} />

        <FeastProgress stats={stats} />

        <FilterControls
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Dish List Sections */}
        <div className="space-y-10 no-print">
          {/* Section 1: Curated Base Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C1E16] tracking-tight">
                  Essential Feast Items
                </h2>
                <span className="text-xs font-semibold text-[#705F55] bg-[#EFE8DC] px-2.5 py-0.5 rounded-full border border-[#E2D7C5]">
                  {coreDishes.length} items
                </span>
              </div>
              <span className="text-xs text-[#705F55] hidden sm:inline">
                Curated traditional staples
              </span>
            </div>

            {coreDishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onOpenClaim={handleOpenClaim}
                    onRequestUnclaim={handleRequestUnclaim}
                    isHost={!!currentUser}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-8 border border-dashed border-[#DFD5C5] text-center text-[#705F55]">
                <SearchX className="w-8 h-8 mx-auto text-[#A69788] mb-2" />
                <p className="text-sm font-medium">No core dishes match your current filter or search.</p>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs font-bold text-[#C25927] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Bring Something Else / Additional Goodies & Wildcards */}
          <section className="pt-6 border-t border-[#E8DEC8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C1E16] tracking-tight">
                    Additional Goodies & Wildcards
                  </h2>
                  <span className="text-xs font-semibold text-[#526650] bg-[#EBF0EA] px-2.5 py-0.5 rounded-full border border-[#D5E0D4]">
                    {customDishes.length} added
                  </span>
                </div>
                <p className="text-xs text-[#705F55] mt-1">
                  Have a signature family recipe, special drink, or appetizer not on the core list?
                </p>
              </div>

              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#526650] hover:bg-[#3D4D3B] text-white font-semibold text-xs sm:text-sm shadow-xs transition active:scale-95 shrink-0 cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Bring Something Else</span>
              </button>
            </div>

            {customDishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onOpenClaim={handleOpenClaim}
                    onRequestUnclaim={handleRequestUnclaim}
                    onRemoveCustom={handleRemoveCustom}
                    isHost={!!currentUser}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-7 border border-dashed border-[#DFD5C5] text-center text-[#705F55]">
                <ChefHat className="w-8 h-8 mx-auto text-[#A69788] mb-2" />
                <p className="text-sm font-medium text-[#4A3B32]">
                  No custom wildcards added yet.
                </p>
                <p className="text-xs text-[#705F55] mt-1">
                  Click <strong>"Bring Something Else"</strong> to add homemade sourdough, mulled cider, vegan roast, or dessert!
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#EAE2D5] bg-[#F7F2EB] py-8 text-center text-xs text-[#705F55] no-print">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="Turkey">🦃</span>
            <span>{feastMeta.title} · Zero login required for guests</span>
          </div>
          <div className="flex items-center gap-4 text-[#4A3B32]">
            <button
              onClick={handlePrint}
              className="hover:text-[#C25927] transition underline underline-offset-4 cursor-pointer"
            >
              Print Fridge Sheet
            </button>
            <span aria-hidden="true" className="text-[#D8CEBE]">·</span>
            <button
              onClick={handleShare}
              className="hover:text-[#C25927] transition underline underline-offset-4 cursor-pointer"
            >
              Share Link
            </button>
            <span aria-hidden="true" className="text-[#D8CEBE]">·</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-[#C25927] transition underline underline-offset-4 cursor-pointer"
            >
              Sync & Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Popups */}
      <ClaimModal
        dish={activeClaimDish}
        isOpen={!!activeClaimDish}
        onClose={() => setActiveClaimDish(null)}
        onConfirmClaim={handleConfirmClaim}
      />

      <CustomDishModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddCustomDish={(params) => {
          addCustomDish(params);
          showToast(`Added "${params.name}" to Additional Goodies!`, '✨');
        }}
      />

      <CreateFeastModal
        isOpen={isCreateFeastOpen}
        onClose={() => setIsCreateFeastOpen(false)}
        onCreateFeast={createFeast}
        onShowToast={showToast}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentFirebaseUrl={firebaseUrl}
        onSaveFirebaseConfig={updateFirebaseConfig}
        onResetDefaults={resetToDefaults}
        onShowToast={showToast}
      />

      {/* Print View for Fridge */}
      <PrintView dishes={dishes} />

      {/* Notification Toast */}
      <Toast
        message={toastInfo.message}
        icon={toastInfo.icon}
        isVisible={toastInfo.visible}
      />
    </div>
  );
}
