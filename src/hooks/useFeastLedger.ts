import { useState, useEffect, useCallback, useMemo } from 'react';
import { DishItem, CuisineCategory, FeastStats, FeastMeta } from '../types';
import { DEFAULT_BASE_ITEMS } from '../data/defaultDishes';
import { db, auth } from '../firebase';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';

// Error handling conforming to Firebase Integration guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Infer cuisine category helper when documents don't have explicit cuisineCategory
function inferCuisineCategory(name: string, emoji?: string): CuisineCategory {
  const n = name.toLowerCase();
  if (n.includes('turkey') || n.includes('main') || n.includes('meat') || n.includes('protein') || n.includes('ham') || n.includes('beef')) return 'mains';
  if (n.includes('pie') || n.includes('cake') || n.includes('cookie') || n.includes('dessert') || (n.includes('sweet') && !n.includes('potato'))) return 'desserts';
  if (n.includes('wine') || n.includes('cider') || n.includes('drink') || n.includes('cocktail') || n.includes('beverage') || n.includes('toddy') || n.includes('bourbon') || n.includes('fashion')) return 'drinks';
  if (n.includes('roll') || n.includes('bread') || n.includes('biscuit') || n.includes('cornbread')) return 'breads';
  if (n.includes('appetizer') || n.includes('charcuterie') || n.includes('cheese board') || n.includes('dip')) return 'appetizers';
  if (n.includes('tableware') || n.includes('ice') || n.includes('cup') || n.includes('plate') || n.includes('napkin') || n.includes('supplies')) return 'supplies';
  return 'sides';
}

function getPotluckIdFromUrl(): string {
  if (typeof window === 'undefined') return 'friendsgiving-2026';
  try {
    const params = new URLSearchParams(window.location.search);
    const potluck = params.get('potluck');
    if (potluck && potluck.trim()) {
      return potluck.trim();
    }
  } catch {}
  return 'friendsgiving-2026';
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
  return DEFAULT_BASE_ITEMS.map((d, idx) => ({ ...d, order: idx + 1 }));
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
    eventDate: 'Saturday, November 7th',
    location: '770 S Hudson St, Denver, CO 80246',
    notes: 'I will begin cooking before 6 and plan to have the food ready no later than 7:00!',
    hostName: 'Weston Dowis',
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
    label: db ? 'Connecting to Firestore...' : 'Offline Mode',
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

  // Initial connection test to Firestore
  useEffect(() => {
    if (!db) return;
    async function testConnection() {
      try {
        await getDocFromServer(doc(db!, 'potlucks', activePotluckId));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    }
    testConnection();
  }, [activePotluckId]);

  // Real-time Firestore listener for Feast Metadata: /potlucks/{activePotluckId}
  useEffect(() => {
    if (!db) return;

    const potluckPath = `potlucks/${activePotluckId}`;
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
              eventDate: data.eventDate || 'Saturday, November 7th',
              location: data.location || '770 S Hudson St, Denver, CO 80246',
              notes: data.notes || 'I will begin cooking before 6 and plan to have the food ready no later than 7:00!',
              hostName: data.ownerName || data.hostName || 'Weston Dowis',
              hostEmail: data.ownerEmail,
              createdAt: data.createdAt,
            };
            setFeastMeta(meta);
            try {
              localStorage.setItem(`friendsgiving_potluck_${activePotluckId}_meta`, JSON.stringify(meta));
            } catch {}
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, potluckPath);
        }
      );

      return () => unsubscribeMeta();
    } catch (e) {
      console.warn('Error attaching Firestore meta listener:', e);
    }
  }, [activePotluckId]);

  // Real-time Firestore listener for Dishes: /potlucks/{activePotluckId}/dishes
  // Directly loads documents from production Firestore preserving all claims (Grant Payne, Weston & Em, etc.)
  useEffect(() => {
    if (!db) return;

    const dishesPath = `potlucks/${activePotluckId}/dishes`;
    try {
      const dishesColRef = collection(db, 'potlucks', activePotluckId, 'dishes');

      const unsubscribeDishes = onSnapshot(
        dishesColRef,
        (querySnapshot) => {
          const loadedDishes: DishItem[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = data.name || 'Dish Item';
            const isCustom = data.isCustom === true;
            const category = (data.category as 'core' | 'custom') || (isCustom ? 'custom' : 'core');

            // Find matching default item to pull fallback emoji or cuisine category if missing
            const defaultMatch = DEFAULT_BASE_ITEMS.find(
              (d) => d.id === docSnap.id || d.name.toLowerCase().trim() === name.toLowerCase().trim()
            );

            loadedDishes.push({
              id: docSnap.id,
              name,
              category,
              cuisineCategory:
                (data.cuisineCategory as CuisineCategory) ||
                defaultMatch?.cuisineCategory ||
                inferCuisineCategory(name, data.emoji),
              emoji: data.emoji || defaultMatch?.emoji || (isCustom ? '🥧' : '🥘'),
              claimedBy: data.claimedBy || null,
              claimedAt: data.claimedAt || null,
              notes: data.notes || '',
              dietary: data.dietary || undefined,
              order: typeof data.order === 'number' ? data.order : (defaultMatch?.order ?? (isCustom ? 99 : 50)),
            });
          });

          // Sort dishes: core items first by order, then custom dishes
          loadedDishes.sort((a, b) => {
            if (a.category === 'core' && b.category !== 'core') return -1;
            if (a.category !== 'core' && b.category === 'core') return 1;
            return (a.order ?? 50) - (b.order ?? 50);
          });

          // Set dishes state directly from Firestore documents (do NOT overwrite with blank localStorage defaults)
          if (loadedDishes.length > 0) {
            setDishes(loadedDishes);
            try {
              localStorage.setItem(`friendsgiving_potluck_${activePotluckId}_dishes`, JSON.stringify(loadedDishes));
            } catch {}
          }

          setSyncStatus({
            connected: true,
            mode: 'firebase',
            label: 'Firestore Live Synced',
            lastSynced: new Date(),
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, dishesPath);
        }
      );

      return () => unsubscribeDishes();
    } catch (e) {
      console.warn('Error attaching Firestore dishes listener:', e);
    }
  }, [activePotluckId]);

  // Create a new feast: writes document to /potlucks/{newId} and seeds dishes subcollection in Firestore
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

      const defaultDishes = DEFAULT_BASE_ITEMS.map((d, idx) => ({
        ...d,
        order: idx + 1,
        claimedBy: null,
        claimedAt: null,
      }));

      // Cache locally
      try {
        localStorage.setItem(`friendsgiving_potluck_${newPotluckId}_meta`, JSON.stringify(newMeta));
        localStorage.setItem(`friendsgiving_potluck_${newPotluckId}_dishes`, JSON.stringify(defaultDishes));
      } catch {}

      // Write feast and seed dishes subcollection in Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'potlucks', newPotluckId), newMeta);
          for (const item of defaultDishes) {
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
          handleFirestoreError(err, OperationType.CREATE, `potlucks/${newPotluckId}`);
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

      // Optimistic visual update
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
        const dishPath = `potlucks/${activePotluckId}/dishes/${id}`;
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
          handleFirestoreError(err, OperationType.UPDATE, dishPath);
        }
      }
    },
    [activePotluckId]
  );

  // Unclaim / Swap action: calls updateDoc on Firestore setting { claimedBy: null, claimedAt: null }
  const unclaimDish = useCallback(
    async (id: string) => {
      // Optimistic visual update immediately so user sees the change
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

      // Write directly to Firestore using updateDoc
      if (db) {
        const dishPath = `potlucks/${activePotluckId}/dishes/${id}`;
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
          await updateDoc(dishRef, {
            claimedBy: null,
            claimedAt: null,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, dishPath);
        }
      }
    },
    [activePotluckId]
  );

  // Add custom dish directly to Firestore: /potlucks/{activePotluckId}/dishes/{customId}
  const addCustomDish = useCallback(
    async (
      input:
        | {
            name: string;
            guestName: string;
            notes?: string;
            cuisineCategory: CuisineCategory;
            emoji?: string;
            dietary?: string;
          }
        | string,
      legacyClaimedBy?: string,
      legacyCuisineCategory: CuisineCategory = 'sides',
      legacyNotes?: string,
      legacyDietary?: string
    ) => {
      let cleanName = '';
      let claimedBy = '';
      let cuisineCategory: CuisineCategory = 'sides';
      let emoji = '🥧';
      let notes = '';
      let dietary: string | undefined = undefined;

      if (typeof input === 'object' && input !== null) {
        cleanName = input.name.trim();
        claimedBy = input.guestName.trim();
        cuisineCategory = input.cuisineCategory || 'sides';
        emoji = input.emoji || '🥧';
        notes = input.notes?.trim() || '';
        dietary = input.dietary?.trim() || undefined;
      } else {
        cleanName = String(input || '').trim();
        claimedBy = String(legacyClaimedBy || '').trim();
        cuisineCategory = legacyCuisineCategory;
        notes = legacyNotes?.trim() || '';
        dietary = legacyDietary?.trim() || undefined;
      }

      const customId = `custom-${Date.now()}`;
      const claimTime = new Date().toISOString();

      const newDishItem: DishItem = {
        id: customId,
        name: cleanName,
        category: 'custom',
        cuisineCategory,
        emoji,
        claimedBy: claimedBy || null,
        claimedAt: claimedBy ? claimTime : null,
        notes,
        dietary,
        order: 99,
      };

      setDishes((prev) => [...prev, newDishItem]);

      if (db) {
        const dishPath = `potlucks/${activePotluckId}/dishes/${customId}`;
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', customId);
          await setDoc(dishRef, {
            id: customId,
            name: cleanName,
            category: 'custom',
            cuisineCategory,
            emoji,
            isCustom: true,
            order: 99,
            claimedBy: newDishItem.claimedBy,
            claimedAt: newDishItem.claimedAt,
            notes: newDishItem.notes,
            dietary: newDishItem.dietary || null,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, dishPath);
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
        const dishPath = `potlucks/${activePotluckId}/dishes/${id}`;
        try {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', id);
          await deleteDoc(dishRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, dishPath);
        }
      }
    },
    [activePotluckId]
  );

  // Reset to default staples
  const resetToDefaults = useCallback(async () => {
    const defaults = DEFAULT_BASE_ITEMS.map((item, idx) => ({ ...item, order: idx + 1 }));
    setDishes(defaults);

    if (db) {
      try {
        for (const item of defaults) {
          const dishRef = doc(db, 'potlucks', activePotluckId, 'dishes', item.id);
          await updateDoc(dishRef, {
            claimedBy: null,
            claimedAt: null,
          });
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

  const firebaseUrl = 'ai-studio-feastledger-f422337c-8205-4459-87b5-cc2d92a932cb';
  const updateFirebaseConfig = useCallback((url: string) => {
    try {
      localStorage.setItem('friendsgiving_firebase_url', url);
    } catch {}
  }, []);

  return {
    dishes,
    feastMeta,
    stats,
    syncStatus,
    activePotluckId,
    firebaseUrl,
    updateFirebaseConfig,
    claimDish,
    unclaimDish,
    addCustomDish,
    removeCustomDish,
    createFeast,
    resetToDefaults,
  };
}
