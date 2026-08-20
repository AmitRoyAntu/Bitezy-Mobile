import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Delivery'); // 'Delivery' | 'Pickup'
  const [loading, setLoading] = useState(true);

  // Load cart from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedCart = await AsyncStorage.getItem('bitezy_cart');
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (e) {
        console.error('Failed to load cart from AsyncStorage:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save cart to storage whenever it updates
  const saveCart = async (newCart) => {
    try {
      setCart(newCart);
      await AsyncStorage.setItem('bitezy_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart to AsyncStorage:', e);
    }
  };

  const updateQty = (name, price, change, img, provider) => {
    let updatedCart = [...cart];
    
    // Check if cart already has items from another provider
    if (updatedCart.length > 0 && provider && updatedCart[0].provider !== provider) {
      // In a real app, user might be prompted, here we replace or clear
      updatedCart = [];
    }

    const index = updatedCart.findIndex((item) => item.name === name);

    if (index > -1) {
      const newQty = updatedCart[index].qty + change;
      if (newQty <= 0) {
        updatedCart.splice(index, 1);
      } else {
        updatedCart[index].qty = newQty;
      }
    } else if (change > 0) {
      updatedCart.push({ name, price, qty: change, img, provider });
    }

    saveCart(updatedCart);
  };

  const removeItem = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = cart.length > 0 && orderType === 'Delivery' ? 30 : 0;
  const total = subtotal + deliveryFee;
  const currentProviderName = cart.length > 0 ? cart[0].provider : null;

  return (
    <CartContext.Provider
      value={{
        cart,
        orderType,
        setOrderType,
        totalItems,
        subtotal,
        deliveryFee,
        total,
        currentProviderName,
        updateQty,
        removeItem,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
