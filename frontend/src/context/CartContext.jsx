// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNotification } from '../components/Notifications/NotificationSystem'; // Para notificaciones de carrito

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { showNotification } = useNotification();

  // Inicializa el carrito desde localStorage o un array vacío
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localCart = localStorage.getItem('cart');
      return localCart ? JSON.parse(localCart) : [];
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error);
      return [];
    }
  });

  // Efecto para guardar el carrito en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Añadir un ítem al carrito
  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item._id === product._id);

      if (existingItemIndex > -1) {
        // Si el producto ya existe, actualiza la cantidad
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        showNotification(`${product.name} actualizado en el carrito.`, 'info');
        return updatedItems;
      } else {
        // Si el producto no existe, añádelo
        showNotification(`${product.name} añadido al carrito.`, 'success');
        return [...prevItems, { ...product, quantity }];
      }
    });
  }, [showNotification]);

  // Eliminar un ítem del carrito
  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item._id === productId);
      if (itemToRemove) {
        showNotification(`${itemToRemove.name} eliminado del carrito.`, 'info');
      }
      return prevItems.filter(item => item._id !== productId);
    });
  }, [showNotification]);

  // Actualizar la cantidad de un ítem en el carrito
  const updateQuantity = useCallback((productId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      const updatedItem = updatedItems.find(item => item._id === productId);
      if (updatedItem) {
        showNotification(`Cantidad de ${updatedItem.name} actualizada a ${newQuantity}.`, 'info');
      }
      return updatedItems;
    });
  }, [showNotification]);

  // Limpiar todo el carrito
  const clearCart = useCallback(() => {
    setCartItems([]);
    showNotification("El carrito ha sido vaciado.", 'info');
  }, [showNotification]);

  // Calcular el total de ítems únicos en el carrito para mostrar en el Header
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Calcular el precio total
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