"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/products";

export type CartItem = {
  product: Product;
  quantity: number;
  engraving: string;
};

type CartContextType = {
  cartItems: CartItem[];
  isOpen: boolean;
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
  addToCart: (product: Product, engraving?: string) => void;
  removeFromCart: (productId: string, engraving: string) => void;
  updateQuantity: (productId: string, engraving: string, quantity: number) => void;
  updateEngraving: (productId: string, oldEngraving: string, newEngraving: string) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("smadar_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("smadar_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  const addToCart = (product: Product, engraving: string = "") => {
    setCartItems((prevItems) => {
      // Find if item with same product ID AND engraving already exists
      const existingIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.engraving === engraving
      );

      if (existingIndex > -1) {
        const nextItems = [...prevItems];
        nextItems[existingIndex].quantity += 1;
        return nextItems;
      }

      return [...prevItems, { product, quantity: 1, engraving }];
    });
    setIsOpen(true); // Auto-open cart drawer when adding item
  };

  const removeFromCart = (productId: string, engraving: string) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.engraving === engraving)
      )
    );
  };

  const updateQuantity = (productId: string, engraving: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, engraving);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.engraving === engraving
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateEngraving = (productId: string, oldEngraving: string, newEngraving: string) => {
    setCartItems((prevItems) => {
      // Check if there is already an item with the target engraving to merge them
      const targetIndex = prevItems.findIndex(
        (item) => item.product.id === productId && item.engraving === newEngraving
      );
      const sourceIndex = prevItems.findIndex(
        (item) => item.product.id === productId && item.engraving === oldEngraving
      );

      if (sourceIndex === -1) return prevItems;

      const nextItems = [...prevItems];
      if (targetIndex > -1 && targetIndex !== sourceIndex) {
        // Merge quantities
        nextItems[targetIndex].quantity += nextItems[sourceIndex].quantity;
        // Remove old item
        nextItems.splice(sourceIndex, 1);
      } else {
        // Simply rename
        nextItems[sourceIndex].engraving = newEngraving.substring(0, 3).toUpperCase();
      }
      return nextItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.priceNum * item.quantity,
    0
  );

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isOpen,
        activeProduct,
        setActiveProduct,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateEngraving,
        clearCart,
        setIsOpen,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
