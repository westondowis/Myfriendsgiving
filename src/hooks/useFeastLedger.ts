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
  getDoc,
  getDocs,
} from 'firebase/firestore';

function getPotluckIdFromUrl(): string {
  if (typeof window === 'undefined') return 'friendsgiving-2026';
  const params = new URLSearchParams(window.location.search);
  return params.get('potluck') || 'friendsgiving-2026';
}

export function useFeastLedger() {
  const [activePotluckId, setActivePotluckId] = useState<string>(() => getPotluckIdFromUrl());

  const [feastMeta, setFeastMeta] = useState<FeastMeta>(() => ({
    id: getPotluckIdFromUrl(),
    title: getPotluckIdFromUrl() === 'friendsgiving-2026' ? 'Friendsgiving Feast Ledger' : 'Friendsgiving Gathering',
    eventDate: 'Thursday, November 26 · 4:00 PM',
    location: '3295 Eliot st, United States',
    notes: 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
    createdAt: new Date().toISOString(),
  }));

  const [dishes, setDishes] = useState<DishItem[]>(() => {
    // Initial fallback while Firestore listener loads
    return DEFAULT_BASE_ITEMS.map((d) => ({ ...d }));
  });

  const [syncStatus, setSyncStatus] = useState<{
    connected: boolean;
    mode: 'multitab' | 'firebase';
    label: string;
    lastSynced: Date | null;
  }>({
    connected: true,
    mode: 'firebase',
    label: 'Live Firestore Connected',
    lastSynced: new Date(),
  });

  // Track URL parameter changes (?potluck=...)
  useEffect(() => {
    const handleUrlChange = () => {
      const currentId = getPotluckIdFromUrl();
      if (currentId !== activePotluckId) {
        setActivePotluckId(currentId);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [activePotluckId]);

  // Real-time Firestore listener for Feast Metadata: /potlucks/{activePotluckId}
  useEffect(() => {
    const potluckRef = doc(db, 'potlucks', activePotluckId);

    const unsubscribeMeta = onSnapshot(
      potluckRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFeastMeta({
            id: activePotluckId,
            title: data.title || (activePotluckId === 'friendsgiving-2026' ? 'Friendsgiving Feast Ledger' : 'Friendsgiving Gathering'),
            eventDate: data.eventDate || 'Thursday, November 26 · 4:00 PM',
            location: data.location || '3295 Eliot st, United States',
            notes: data.notes || 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
            hostName: data.ownerName || data.hostName,
            createdAt: data.createdAt,
          });
        } else {
          // If the default feast document hasn't been written to Firestore yet, register it
          if (activePotluckId === 'friendsgiving-2026') {
            const initialMeta = {
              id: 'friendsgiving-2026',
              title: 'Friendsgiving Feast Ledger',
              eventDate: 'Thursday, November 26 · 4:00 PM',
              location: '3295 Eliot st, United States',
              notes: 'Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!',
              createdAt: new Date().toISOString(),
            };
            setDoc(potluckRef, initialMeta, { merge: true }).catch((err) =>
              console.warn('Initial potluck doc registration notice:', err)
            );
          }
        }
      },
      (error) => {
        console.warn('Firestore potluck metadata listener notice:', error);
      }
    );

    return () => unsubscribeMeta();
  }, [activePotluckId]);

  // Real-time Firestore listener for Dishes: /potlucks/{activePotluckId}/dishes
  useEffect(() => {
    const dishesColRef = collection(db, 'potlucks', activePotluckId, 'dishes');

    const unsubscribeDishes = onSnapshot(
      dishesColRef,
      async (querySnapshot) => {
        // NON-DESTRUCTIVE: If documents exist, read all existing items and their claims first!
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
            });
          });

          // Sort by order field if present
          loadedDishes.sort((a, b) => {
            const docA = querySnapshot.docs.find((d) => d.id === a.id);
            const docB = querySnapshot.docs.find((d) => d.id === b.id);
            const orderA = docA?.data().order ?? 50;
            const orderB = docB?.data().order ?? 50;
            return orderA - orderB;
          });

          setDishes(loadedDishes);
          setSyncStatus({
            connected: true,
            mode: 'firebase',
            label: 'Firestore Real-Time Sync Active',
            lastSynced: new Date(),
          });
        } else {
          // Only seed default items if the collection in Firestore is COMPLETELY empty!
          try {
            for (const item of DEFAULT_BASE_ITEMS) {
              const dishDocRef = doc(db, 'potlucks', activePotluckId, 'dishes', item.id);
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
          } catch (err) {
            console.warn('Initial dish seeding notice:', err);
          }
        }
      },
      (error) => {
        console.warn('Firestore dishes listener notice:', error);
        setSyncStatus({
          connected: false,
          mode: 'firebase',
          label: 'Firestore Reconnecting...',
          lastSynced: new Date(),
        });
      }
    );

    return () => unsubscribeDishes();
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

      try {
        // Write potluck event document in Firestore
        await setDoc(doc(db, 'potlucks', newPotluckId), newMeta);

        // Seed default staples into new feast
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
        console.error('Error creating feast in Firestore:', err);
      }

      // Update URL query parameter
      const newUrl = `${window.location.pathname}?potluck=${encodeURIComponent(newPotluckId)}`;
      window.history.pushState({ potluck: newPotluckId }, '', newUrl);

      setActivePotluckId(newPotluckId);
      setFeastMeta(newMeta);

      return newPotluckId;
    },
    []
  );

  // Claim a dish directly in Firestore: /potlucks/{activePotluckId}/dishes/{dishId}
  const claimDish = useCallback(
    async (id: string, guestName: string, notes?: string, dietary?: string) => {
      const claimTime = new Date().toISOString();

      // Optimistic visual update
      setDishes((prev) => {
        return prev.map((d) => {
          if (d.id === id) {
            return {
              ...d,
              claimedBy: guestName.trim(),
              claimedAt: claimTime,
              notes: notes?.trim() || '',
              dietary: dietary?.trim() || undefined,
            };
          }
          return d;
        });
      });

      // Write directly to Firestore
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
    },
    [activePotluckId]
  );

  // Unclaim a dish directly in Firestore
  const unclaimDish = useCallback(
    async (id: string) => {
      // Optimistic visual update
      setDishes((prev) => {
        return prev.map((d) => {
          if (d.id === id) {
            return {
              ...d,
              claimedBy: null,
              claimedAt: null,
              notes: '',
              dietary: undefined,
            };
          }
          return d;
        });
      });

      // Write directly to Firestore
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
      };

      // Optimistic update
      setDishes((prev) => [...prev, newDishItem]);

      // Write to Firestore
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

      return newDishItem;
    },
    [activePotluckId]
  );

  // Remove a custom dish from Firestore
  const removeCustomDish = useCallback(
    async (id: string) => {
      setDishes((prev) => prev.filter((d) => d.id !== id));

      try {
        const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
        await deleteDoc(dishRef);
      } catch (err) {
        console.error('Firestore delete custom dish error:', err);
      }
    },
    [activePotluckId]
  );

  // Reset to default staples
  const resetToDefaults = useCallback(async () => {
    const defaults = DEFAULT_BASE_ITEMS.map((item) => ({ ...item }));
    setDishes(defaults);

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
