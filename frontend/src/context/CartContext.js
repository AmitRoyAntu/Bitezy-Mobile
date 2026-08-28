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

  const updateQty = (name, price, change, img, provider, desc, providerId = null) => {
    let updatedCart = [...cart];
    
    let resolvedProviderName = typeof provider === 'object' ? (provider.name || 'Campus Canteen') : (provider || 'Campus Canteen');
    let resolvedProviderId = providerId || (typeof provider === 'object' ? (provider._id || provider.id) : null);

    // Check if cart already has items from another provider
    if (updatedCart.length > 0 && resolvedProviderName && updatedCart[0].provider !== resolvedProviderName) {
      updatedCart = [];
    }

    const index = updatedCart.findIndex((item) => item.name === name);

    if (index > -1) {
      const newQty = updatedCart[index].qty + change;
      if (newQty <= 0) {
        updatedCart.splice(index, 1);
      } else {
        updatedCart[index].qty = newQty;
        if (desc && !updatedCart[index].desc) {
          updatedCart[index].desc = desc;
        }
        if (resolvedProviderId && !updatedCart[index].providerId) {
          updatedCart[index].providerId = resolvedProviderId;
        }
      }
    } else if (change > 0) {
      updatedCart.push({
        name,
        price,
        qty: change,
        img,
        provider: resolvedProviderName,
        providerId: resolvedProviderId,
        desc: desc || ''
      });
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

  const reorderOrder = (orderItems, providerName, providerId = null) => {
    const newCart = (orderItems || []).map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty || 1,
      img: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100',
      provider: typeof providerName === 'object' ? providerName.name : providerName,
      providerId: providerId || (typeof providerName === 'object' ? (providerName._id || providerName.id) : null),
      desc: item.desc || '',
    }));
    saveCart(newCart);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = cart.length > 0 && orderType === 'Delivery' ? 30 : 0;
  const total = subtotal + deliveryFee;
  const currentProviderName = cart.length > 0 ? (typeof cart[0].provider === 'object' ? cart[0].provider.name : cart[0].provider) : null;
  const currentProviderId = cart.length > 0 ? (cart[0].providerId || (typeof cart[0].provider === 'object' ? (cart[0].provider._id || cart[0].provider.id) : null)) : null;

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
        currentProviderId,
        updateQty,
        removeItem,
        clearCart,
        reorderOrder,
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

export default CartContext;
