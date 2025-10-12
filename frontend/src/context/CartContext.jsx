import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNotification } from '../components/Notifications/NotificationSystem';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { showNotification } = useNotification(); // <<-- Vuelve a colocar esto aquí, es correcto.

  const [cartItems, setCartItems] = useState(() => {
    try {
      const localCart = localStorage.getItem('cart');
      return localCart ? JSON.parse(localCart) : [];
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item._id === product._id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        // Posponer la notificación para después del renderizado actual
        setTimeout(() => showNotification(`${product.name} actualizado en el carrito.`, 'info'), 0);
        return updatedItems;
      } else {
        // Posponer la notificación
        setTimeout(() => showNotification(`${product.name} añadido al carrito.`, 'success'), 0);
        const productWithImageUrl = { ...product, imageUrl: product.imageUrl || product.image };
        return [...prevItems, { ...productWithImageUrl, quantity }];
      }
    });
  }, [showNotification]); // showNotification debe ser una dependencia aquí

  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item._id === productId);
      if (itemToRemove) {
        // Posponer la notificación
        setTimeout(() => showNotification(`${itemToRemove.name} eliminado del carrito.`, 'info'), 0);
      }
      return prevItems.filter(item => item._id !== productId);
    });
  }, [showNotification]); // showNotification debe ser una dependencia aquí

  const updateQuantity = useCallback((productId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      const updatedItem = updatedItems.find(item => item._id === productId);
      if (updatedItem) {
        // Posponer la notificación
        setTimeout(() => showNotification(`Cantidad de ${updatedItem.name} actualizada a ${newQuantity}.`, 'info'), 0);
      }
      return updatedItems;
    });
  }, [showNotification]); // showNotification debe ser una dependencia aquí

  const clearCart = useCallback(() => {
    console.log("¡DEBUG! Se está llamando a clearCart. Trazando origen:");
    console.trace(); 
    setCartItems([]);
    localStorage.removeItem('cart'); 
    // Posponer la notificación
    setTimeout(() => showNotification("El carrito ha sido vaciado.", 'info'), 0);
  }, [showNotification]); // showNotification debe ser una dependencia aquí

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const cartContextValue = {
    cartItems,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};