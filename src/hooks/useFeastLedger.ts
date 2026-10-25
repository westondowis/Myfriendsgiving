import { useState, useEffect, useCallback, useMemo } from 'react';
import { DishItem, CuisineCategory, FeastStats, FeastMeta } from '../types';
import { DEFAULT_BASE_ITEMS } from '../data/defaultDishes';
import { db } from '../firebase';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

function getPotluckIdFromUrl(): string {
  if (typeof window === 'undefined') return 'friendsgiving-2026';
  const params = new URLSearchParams(window.location.search);
  return params.get('potluck') || 'friendsgiving-2026';
}

function getCachedDishes(potluckId: string): DishItem[] {
  try {
    const key = `friendsgiving_potluck_${potluckId}_dishes`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_BASE_ITEMS.map((d) => ({ ...d }));
}

function getCachedMeta(potluckId: string): FeastMeta {
  try {
    const key = `friendsgiving_potluck_${potluckId}_meta`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.title) {
        return parsed;
      }
    }
  } catch {}
  return {
    id: potluckId,
    title: potluckId === 'friendsgiving-2026' ? 'Friendsgiving Feast Ledger' : 'Friendsgiving Gathering',
    eventDate: 'Thursday, November 26 · 4:00 PM',
    location: '3295 Eliot st, United States',
    notes: 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
    createdAt: new Date().toISOString(),
  };
}

export function useFeastLedger() {
  const [activePotluckId, setActivePotluckId] = useState<string>(() => getPotluckIdFromUrl());
  const [feastMeta, setFeastMeta] = useState<FeastMeta>(() => getCachedMeta(getPotluckIdFromUrl()));
  const [dishes, setDishes] = useState<DishItem[]>(() => getCachedDishes(getPotluckIdFromUrl()));

  const [syncStatus, setSyncStatus] = useState<{
    connected: boolean;
    mode: 'multitab' | 'firebase';
    label: string;
    lastSynced: Date | null;
  }>({
    connected: !!db,
    mode: 'firebase',
    label: db ? 'Firestore Live Synced' : 'Offline Mode',
    lastSynced: new Date(),
  });

  // Track URL parameter changes (?potluck=...)
  useEffect(() => {
    const handleUrlChange = () => {
      const currentId = getPotluckIdFromUrl();
      if (currentId !== activePotluckId) {
        setActivePotluckId(currentId);
        setFeastMeta(getCachedMeta(currentId));
        setDishes(getCachedDishes(currentId));
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [activePotluckId]);

  // Real-time Firestore listener for Feast Metadata: /potlucks/{activePotluckId}
  useEffect(() => {
    if (!db) return;

    try {
      const potluckRef = doc(db, 'potlucks', activePotluckId);

      const unsubscribeMeta = onSnapshot(
        potluckRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const meta: FeastMeta = {
              id: activePotluckId,
              title: data.title || (activePotluckId === 'friendsgiving-2026' ? 'Friendsgiving Feast Ledger' : 'Friendsgiving Gathering'),
              eventDate: data.eventDate || 'Thursday, November 26 · 4:00 PM',
              location: data.location || '3295 Eliot st, United States',
              notes: data.notes || 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
              hostName: data.ownerName || data.hostName,
              createdAt: data.createdAt,
            };
            setFeastMeta(meta);
            try {
              localStorage.setItem(`friendsgiving_potluck_${activePotluckId}_meta`, JSON.stringify(meta));
            } catch {}
          } else if (activePotluckId === 'friendsgiving-2026') {
            const initialMeta = {
              id: 'friendsgiving-2026',
              title: 'Friendsgiving Feast Ledger',
              eventDate: 'Thursday, November 26 · 4:00 PM',
              location: '3295 Eliot st, United States',
              notes: 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
              createdAt: new Date().toISOString(),
            };
            setDoc(potluckRef, initialMeta, { merge: true }).catch(() => {});
          }
        },
        (error) => {
          console.warn('Firestore metadata notice:', error);
        }
      );

      return () => unsubscribeMeta();
    } catch (e) {
      console.warn('Error attaching Firestore meta listener:', e);
    }
  }, [activePotluckId]);

  // Real-time Firestore listener for Dishes: /potlucks/{activePotluckId}/dishes
  useEffect(() => {
    if (!db) return;

    try {
      const dishesColRef = collection(db, 'potlucks', activePotluckId, 'dishes');

      const unsubscribeDishes = onSnapshot(
        dishesColRef,
        async (querySnapshot) => {
          // Non-destructive: if collection has items, load them and preserve all existing claims
          if (!querySnapshot.empty) {
            const loadedDishes: DishItem[] = [];

            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              loadedDishes.push({
                id: docSnap.id,
                name: data.name || 'Dish Item',
                category: data.isCustom ? 'custom' : (data.category || 'core'),
                cuisineCategory: (data.cuisineCategory as CuisineCategory) || 'sides',
                emoji: data.emoji || (data.isCustom ? '🥧' : '🥘'),
                claimedBy: data.claimedBy || null,
                claimedAt: data.claimedAt || null,
                notes: data.notes || '',
                dietary: data.dietary || undefined,
                order: data.order ?? 50,
              });
            });

            // Sort by order field
            loadedDishes.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

            setDishes(loadedDishes);
            try {
              localStorage.setItem(`friendsgiving_potluck_${activePotluckId}_dishes`, JSON.stringify(loadedDishes));
            } catch {}

            setSyncStatus({
              connected: true,
              mode: 'firebase',
              label: 'Firestore Real-Time Sync Active',
              lastSynced: new Date(),
            });
          } else {
            // Only seed defaults if the Firestore collection is completely empty
            for (const item of DEFAULT_BASE_ITEMS) {
              const dishDocRef = doc(db!, 'potlucks', activePotluckId, 'dishes', item.id);
              await setDoc(dishDocRef, {
                id: item.id,
                name: item.name,
                emoji: item.emoji,
                order: item.order ?? 50,
                isCustom: false,
                category: item.category,
                cuisineCategory: item.cuisineCategory,
                claimedBy: null,
                claimedAt: null,
              });
            }
          }
        },
        (error) => {
          console.warn('Firestore dishes notice:', error);
          setSyncStatus((prev) => ({
            ...prev,
            connected: false,
            label: 'Firestore Reconnecting...',
          }));
        }
      );

      return () => unsubscribeDishes();
    } catch (e) {
      console.warn('Error attaching Firestore dishes listener:', e);
    }
  }, [activePotluckId]);

  // Create a new feast: writes document to /potlucks/{newId} in Firestore
  const createFeast = useCallback(
    async (meta: { title: string; eventDate?: string; location?: string; notes?: string }) => {
      const cleanSlug = meta.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 20) || 'feast';
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const newPotluckId = `${cleanSlug}-${uniqueSuffix}`;

      const newMeta: FeastMeta = {
        id: newPotluckId,
        title: meta.title,
        eventDate: meta.eventDate || 'Thursday, November 26 · 4:00 PM',
        location: meta.location || '3295 Eliot st, United States',
        notes: meta.notes || 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
        createdAt: new Date().toISOString(),
      };

      const defaultDishes = DEFAULT_BASE_ITEMS.map((d) => ({
        ...d,
        claimedBy: null,
        claimedAt: null,
      }));

      // Cache locally
      try {
        localStorage.setItem(`friendsgiving_potluck_${newPotluckId}_meta`, JSON.stringify(newMeta));
        localStorage.setItem(`friendsgiving_potluck_${newPotluckId}_dishes`, JSON.stringify(defaultDishes));
      } catch {}

      // Write to Firestore if connected
      if (db) {
        try {
          await setDoc(doc(db, 'potlucks', newPotluckId), newMeta);
          for (const item of DEFAULT_BASE_ITEMS) {
            await setDoc(doc(db, 'potlucks', newPotluckId, 'dishes', item.id), {
              id: item.id,
              name: item.name,
              emoji: item.emoji,
              order: item.order ?? 50,
              isCustom: false,
              category: item.category,
              cuisineCategory: item.cuisineCategory,
              claimedBy: null,
              claimedAt: null,
            });
          }
        } catch (err) {
          console.warn('Notice writing new feast to Firestore:', err);
        }
      }

      // Update URL query parameter
      const newUrl = `${window.location.pathname}?potluck=${encodeURIComponent(newPotluckId)}`;
      window.history.pushState({ potluck: newPotluckId }, '', newUrl);

      setActivePotluckId(newPotluckId);
      setFeastMeta(newMeta);
      setDishes(defaultDishes);

      return newPotluckId;
    },
    []
  );

  // Claim a dish directly in Firestore: /potlucks/{activePotluckId}/dishes/{dishId}
  const claimDish = useCallback(
    async (id: string, guestName: string, notes?: string, dietary?: string) => {
      const claimTime = new Date().toISOString();

      // Optimistic update
      setDishes((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                claimedBy: guestName.trim(),
                claimedAt: claimTime,
                notes: notes?.trim() || '',
                dietary: dietary?.trim() || undefined,
              }
            : d
        )
      );

      // Write directly to Firestore
      if (db) {
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
          await setDoc(
            dishRef,
            {
              claimedBy: guestName.trim(),
              claimedAt: claimTime,
              notes: notes?.trim() || '',
              dietary: dietary?.trim() || null,
            },
            { merge: true }
          );
        } catch (err) {
          console.error('Firestore claim write error:', err);
        }
      }
    },
    [activePotluckId]
  );

  // Unclaim a dish directly in Firestore
  const unclaimDish = useCallback(
    async (id: string) => {
      // Optimistic visual update
      setDishes((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                claimedBy: null,
                claimedAt: null,
                notes: '',
                dietary: undefined,
              }
            : d
        )
      );

      // Write directly to Firestore
      if (db) {
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
          await setDoc(
            dishRef,
            {
              claimedBy: null,
              claimedAt: null,
              notes: '',
              dietary: null,
            },
            { merge: true }
          );
        } catch (err) {
          console.error('Firestore unclaim write error:', err);
        }
      }
    },
    [activePotluckId]
  );

  // Add custom dish ("Bring Something Else / Wildcard") directly to Firestore
  const addCustomDish = useCallback(
    async (params: {
      name: string;
      guestName: string;
      notes?: string;
      cuisineCategory?: CuisineCategory;
      emoji?: string;
      dietary?: string;
    }) => {
      const customId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newDishItem: DishItem = {
        id: customId,
        name: params.name.trim(),
        category: 'custom',
        cuisineCategory: params.cuisineCategory || 'sides',
        emoji: params.emoji || '🥧',
        claimedBy: params.guestName.trim(),
        claimedAt: new Date().toISOString(),
        notes: params.notes?.trim() || '',
        dietary: params.dietary?.trim() || undefined,
        order: 99,
      };

      // Optimistic update
      setDishes((prev) => [...prev, newDishItem]);

      // Write to Firestore
      if (db) {
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', customId);
          await setDoc(dishRef, {
            id: customId,
            name: newDishItem.name,
            category: 'custom',
            cuisineCategory: newDishItem.cuisineCategory,
            emoji: newDishItem.emoji,
            isCustom: true,
            order: 99,
            claimedBy: newDishItem.claimedBy,
            claimedAt: newDishItem.claimedAt,
            notes: newDishItem.notes,
            dietary: newDishItem.dietary || null,
          });
        } catch (err) {
          console.error('Firestore custom dish error:', err);
        }
      }

      return newDishItem;
    },
    [activePotluckId]
  );

  // Remove a custom dish from Firestore
  const removeCustomDish = useCallback(
    async (id: string) => {
      setDishes((prev) => prev.filter((d) => d.id !== id));

      if (db) {
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
          await deleteDoc(dishRef);
        } catch (err) {
          console.error('Firestore delete custom dish error:', err);
        }
      }
    },
    [activePotluckId]
  );

  // Reset to default staples
  const resetToDefaults = useCallback(async () => {
    const defaults = DEFAULT_BASE_ITEMS.map((item) => ({ ...item }));
    setDishes(defaults);

    if (db) {
      try {
        for (const item of defaults) {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', item.id);
          await setDoc(
            dishRef,
            {
              claimedBy: null,
              claimedAt: null,
              notes: '',
              dietary: null,
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn('Reset defaults notice:', err);
      }
    }
  }, [activePotluckId]);

  // Compute live statistics
  const stats: FeastStats = useMemo(() => {
    const coreDishes = dishes.filter((d) => d.category === 'core');
    const claimedCore = coreDishes.filter((d) => !!d.claimedBy).length;
    const totalCustom = dishes.filter((d) => d.category === 'custom').length;
    const neededTotal = dishes.filter((d) => !d.claimedBy).length;
    const percentCore = coreDishes.length > 0 ? Math.round((claimedCore / coreDishes.length) * 100) : 0;

    return {
      totalCore: coreDishes.length,
      claimedCore,
      totalCustom,
      totalDishes: dishes.length,
      neededTotal,
      percentCore,
    };
  }, [dishes]);

  return {
    activePotluckId,
    feastMeta,
    dishes,
    stats,
    syncStatus,
    firebaseUrl: '',
    createFeast,
    claimDish,
    unclaimDish,
    addCustomDish,
    removeCustomDish,
    resetToDefaults,
    updateFirebaseConfig: () => {},
  };
}
