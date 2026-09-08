import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DataService from '../api/DataService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('bitezy_token');
      if (storedToken && !storedToken.startsWith('mock_token_')) {
        setToken(storedToken);
        const user = await DataService.getMe();
        if (user && user._id) {
          setCurrentUser(user);
        } else {
          // Bad/expired token
          await AsyncStorage.removeItem('bitezy_token');
          setToken(null);
          setCurrentUser(null);
        }
      } else {
        if (storedToken && storedToken.startsWith('mock_token_')) {
          await AsyncStorage.removeItem('bitezy_token');
        }
        setToken(null);
        setCurrentUser(null);
      }
    } catch (error) {
      console.warn('Failed to restore auth session, clearing token:', error.message);
      await AsyncStorage.removeItem('bitezy_token');
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.setItem('bitezy_token', authToken);
      setToken(authToken);
      setCurrentUser(userData);
    } catch (e) {
      console.error('Failed to store auth token:', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('bitezy_token');
      await AsyncStorage.removeItem('bitezy_cart');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('bitezy_token');
        window.localStorage.removeItem('bitezy_cart');
      }
      if (DataService.logout) {
        await DataService.logout();
      }
      setToken(null);
      setCurrentUser(null);
    } catch (e) {
      console.error('Failed to clear storage on logout:', e);
      setToken(null);
      setCurrentUser(null);
    }
  };

  const updateUser = (data) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = !!token && !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
        refreshProfile: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
