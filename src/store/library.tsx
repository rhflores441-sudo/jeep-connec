import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants/config';
import type { RadioStation } from '@/services/radio';

export type FavoritePlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  savedAt: number;
};

export type HistoryEntry = {
  id: string;
  source: 'radio' | 'spotify';
  title: string;
  subtitle: string;
  artwork: string | null;
  playedAt: number;
  station?: RadioStation;
  contextUri?: string;
};

type Library = {
  radioFavorites: RadioStation[];
  places: FavoritePlace[];
  history: HistoryEntry[];
};

const EMPTY_LIBRARY: Library = { radioFavorites: [], places: [], history: [] };

type LibraryContextValue = {
  library: Library;
  hydrated: boolean;
  isRadioFavorite: (stationId: string) => boolean;
  toggleRadioFavorite: (station: RadioStation) => void;
  savePlace: (place: Omit<FavoritePlace, 'savedAt'>) => void;
  removePlace: (placeId: string) => void;
  addHistory: (entry: Omit<HistoryEntry, 'playedAt'>) => void;
  clearHistory: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function parseLibrary(raw: string | null): Library {
  if (!raw) return EMPTY_LIBRARY;
  try {
    const parsed = JSON.parse(raw) as Partial<Library>;
    return {
      radioFavorites: Array.isArray(parsed.radioFavorites) ? parsed.radioFavorites.filter(Boolean) : [],
      places: Array.isArray(parsed.places) ? parsed.places.filter(Boolean) : [],
      history: Array.isArray(parsed.history) ? parsed.history.filter(Boolean).slice(0, 60) : [],
    };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Library>(EMPTY_LIBRARY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEYS.library)
      .then((raw) => {
        if (active) setLibrary(parseLibrary(raw));
      })
      .catch((error) => console.warn('[library] No se pudo leer la biblioteca', error))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const mutate = useCallback((updater: (previous: Library) => Library) => {
    setLibrary((previous) => {
      const next = updater(previous);
      AsyncStorage.setItem(STORAGE_KEYS.library, JSON.stringify(next)).catch((error) =>
        console.warn('[library] No se pudo guardar la biblioteca', error),
      );
      return next;
    });
  }, []);

  const isRadioFavorite = useCallback(
    (stationId: string) => library.radioFavorites.some((station) => station.id === stationId),
    [library.radioFavorites],
  );

  const toggleRadioFavorite = useCallback(
    (station: RadioStation) => {
      mutate((previous) => {
        const exists = previous.radioFavorites.some((favorite) => favorite.id === station.id);
        return {
          ...previous,
          radioFavorites: exists
            ? previous.radioFavorites.filter((favorite) => favorite.id !== station.id)
            : [station, ...previous.radioFavorites].slice(0, 50),
        };
      });
    },
    [mutate],
  );

  const savePlace = useCallback(
    (place: Omit<FavoritePlace, 'savedAt'>) => {
      mutate((previous) => {
        if (previous.places.some((saved) => saved.id === place.id)) return previous;
        return {
          ...previous,
          places: [{ ...place, savedAt: Date.now() }, ...previous.places].slice(0, 40),
        };
      });
    },
    [mutate],
  );

  const removePlace = useCallback(
    (placeId: string) => {
      mutate((previous) => ({ ...previous, places: previous.places.filter((place) => place.id !== placeId) }));
    },
    [mutate],
  );

  const addHistory = useCallback(
    (entry: Omit<HistoryEntry, 'playedAt'>) => {
      mutate((previous) => {
        const last = previous.history[0];
        if (last && last.id === entry.id && last.source === entry.source && Date.now() - last.playedAt < 30_000) {
          return previous;
        }
        return {
          ...previous,
          history: [{ ...entry, playedAt: Date.now() }, ...previous.history].slice(0, 60),
        };
      });
    },
    [mutate],
  );

  const clearHistory = useCallback(() => {
    mutate((previous) => ({ ...previous, history: [] }));
  }, [mutate]);

  const value = useMemo(
    () => ({
      library,
      hydrated,
      isRadioFavorite,
      toggleRadioFavorite,
      savePlace,
      removePlace,
      addHistory,
      clearHistory,
    }),
    [library, hydrated, isRadioFavorite, toggleRadioFavorite, savePlace, removePlace, addHistory, clearHistory],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary debe usarse dentro de LibraryProvider');
  return context;
}
