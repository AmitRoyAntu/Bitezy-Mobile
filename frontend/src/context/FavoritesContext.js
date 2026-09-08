import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './ToastContext';

const FavoritesContext = createContext();

const STORAGE_KEY = '@bitezy_customer_favorites';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
  };

  const saveFavorites = async (newList) => {
    try {
      setFavorites(newList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  };

  const isFavorite = (item) => {
    if (!item) return false;
    const itemId = item._id || item.id || item.name;
    return favorites.some((f) => (f._id || f.id || f.name) === itemId);
  };

  const toggleFavorite = async (item) => {
    if (!item) return;
    const itemId = item._id || item.id || item.name;
    const exists = favorites.some((f) => (f._id || f.id || f.name) === itemId);

    let updated;
    if (exists) {
      updated = favorites.filter((f) => (f._id || f.id || f.name) !== itemId);
      showToast(`Removed "${item.name}" from saved list`);
    } else {
      updated = [item, ...favorites];
      showToast(`Saved "${item.name}" to watchlist`);
    }
    await saveFavorites(updated);

  };

  const removeFavorite = async (itemId) => {
    const updated = favorites.filter((f) => (f._id || f.id || f.name) !== itemId);
    await saveFavorites(updated);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        removeFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
