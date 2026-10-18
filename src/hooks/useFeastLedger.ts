import { useState, useEffect, useCallback, useMemo } from 'react';
import { DishItem, CuisineCategory, FeastStats } from '../types';
import { DEFAULT_BASE_ITEMS } from '../data/defaultDishes';

const STORAGE_KEY = 'friendsgiving_feast_ledger_v3';
const FIREBASE_CONFIG_KEY = 'friendsgiving_feast_rtdb_config';

export function useFeastLedger() {
  const [dishes, setDishes] = useState<DishItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved dishes from localStorage:', e);
    }
    return DEFAULT_BASE_ITEMS;
  });

  const [firebaseUrl, setFirebaseUrl] = useState<string>(() => {
    return localStorage.getItem(FIREBASE_CONFIG_KEY) || '';
  });

  const [syncStatus, setSyncStatus] = useState<{
    connected: boolean;
    mode: 'multitab' | 'firebase';
    label: string;
    lastSynced: Date | null;
  }>({
    connected: true,
    mode: 'multitab',
    label: 'Live Multi-Tab Sync Active',
    lastSynced: new Date(),
  });

  // Save to localStorage & broadcast across tabs
  const broadcastUpdate = useCallback((newDishes: DishItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDishes));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('friendsgiving_feast_sync');
        bc.postMessage({ type: 'DISHES_UPDATED', dishes: newDishes, timestamp: Date.now() });
        bc.close();
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }, []);

  // Multi-tab broadcast listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('friendsgiving_feast_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'DISHES_UPDATED' && Array.isArray(event.data.dishes)) {
          setDishes(event.data.dishes);
          setSyncStatus(prev => ({
            ...prev,
            lastSynced: new Date(),
          }));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDishes(parsed);
            setSyncStatus(prev => ({ ...prev, lastSynced: new Date() }));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Firebase Realtime DB sync if configured
  useEffect(() => {
    if (!firebaseUrl || !firebaseUrl.trim()) {
      setSyncStatus({
        connected: true,
        mode: 'multitab',
        label: 'Live Multi-Tab Sync Active',
        lastSynced: new Date(),
      });
      return;
    }

    const cleanUrl = firebaseUrl.trim().replace(/\/$/, '');
    // If user provided a Firebase Realtime Database URL
    const endpoint = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}/feast_ledger/dishes.json`;

    let isSubscribed = true;

    const fetchCloud = async () => {
      try {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isSubscribed) {
            setDishes(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setSyncStatus({
              connected: true,
              mode: 'firebase',
              label: 'Firebase Cloud Connected',
              lastSynced: new Date(),
            });
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setSyncStatus({
            connected: false,
            mode: 'firebase',
            label: 'Cloud Sync Paused (Check URL rules)',
            lastSynced: new Date(),
          });
        }
      }
    };

    fetchCloud();
    const interval = setInterval(fetchCloud, 10000); // 10s poll for cross-device updates

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [firebaseUrl]);

  // Sync out to Firebase if configured
  const syncToCloud = useCallback(async (updatedDishes: DishItem[]) => {
    if (!firebaseUrl || !firebaseUrl.trim()) return;
    try {
      const cleanUrl = firebaseUrl.trim().replace(/\/$/, '');
      const endpoint = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}/feast_ledger/dishes.json`;
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDishes),
      });
      setSyncStatus(prev => ({
        ...prev,
        connected: true,
        mode: 'firebase',
        label: 'Firebase Cloud Live',
        lastSynced: new Date(),
      }));
    } catch (err) {
      console.warn('Could not write to Firebase:', err);
    }
  }, [firebaseUrl]);

  // Claim an item
  const claimDish = useCallback((id: string, guestName: string, notes?: string, dietary?: string) => {
    setDishes((prev) => {
      const index = prev.findIndex((d) => d.id === id);
      if (index === -1) return prev;

      // Check if already claimed to prevent race conditions
      if (prev[index].claimedBy) {
        throw new Error('This dish has already been locked in by another guest!');
      }

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        claimedBy: guestName.trim(),
        claimedAt: new Date().toISOString(),
        notes: notes?.trim() || '',
        dietary: dietary?.trim() || undefined,
      };

      broadcastUpdate(updated);
      syncToCloud(updated);
      return updated;
    });
  }, [broadcastUpdate, syncToCloud]);

  // Unclaim an item (with safety)
  const unclaimDish = useCallback((id: string) => {
    setDishes((prev) => {
      const index = prev.findIndex((d) => d.id === id);
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        claimedBy: null,
        claimedAt: null,
        notes: '',
        dietary: undefined,
      };

      broadcastUpdate(updated);
      syncToCloud(updated);
      return updated;
    });
  }, [broadcastUpdate, syncToCloud]);

  // Add custom dish ("Bring Something Else / Wildcard")
  const addCustomDish = useCallback((params: {
    name: string;
    guestName: string;
    notes?: string;
    cuisineCategory?: CuisineCategory;
    emoji?: string;
    dietary?: string;
  }) => {
    const newDish: DishItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim(),
      category: 'custom',
      cuisineCategory: params.cuisineCategory || 'sides',
      emoji: params.emoji || '🥧',
      claimedBy: params.guestName.trim(),
      claimedAt: new Date().toISOString(),
      notes: params.notes?.trim() || '',
      dietary: params.dietary?.trim() || undefined,
    };

    setDishes((prev) => {
      const updated = [...prev, newDish];
      broadcastUpdate(updated);
      syncToCloud(updated);
      return updated;
    });

    return newDish;
  }, [broadcastUpdate, syncToCloud]);

  // Remove a custom item completely if requested
  const removeCustomDish = useCallback((id: string) => {
    setDishes((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      broadcastUpdate(updated);
      syncToCloud(updated);
      return updated;
    });
  }, [broadcastUpdate, syncToCloud]);

  // Reset to default 14 curated base items
  const resetToDefaults = useCallback(() => {
    const defaults = DEFAULT_BASE_ITEMS.map((item) => ({ ...item }));
    setDishes(defaults);
    broadcastUpdate(defaults);
    syncToCloud(defaults);
  }, [broadcastUpdate, syncToCloud]);

  // Update Firebase configuration URL
  const updateFirebaseConfig = useCallback((url: string) => {
    const trimmed = url.trim();
    setFirebaseUrl(trimmed);
    localStorage.setItem(FIREBASE_CONFIG_KEY, trimmed);
  }, []);

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
    dishes,
    stats,
    syncStatus,
    firebaseUrl,
    claimDish,
    unclaimDish,
    addCustomDish,
    removeCustomDish,
    resetToDefaults,
    updateFirebaseConfig,
  };
}
