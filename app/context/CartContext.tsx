"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/catalog/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  isOpen: boolean;
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  catalog,
}: {
  children: React.ReactNode;
  catalog: Product[];
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    // localStorage only exists in the browser, so the saved cart can only be
    // read after mount; reading it during render would break hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    try {
      const savedCart = localStorage.getItem("smadar_cart");
      if (savedCart) setCartItems(syncWithCatalog(JSON.parse(savedCart), catalog));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
    // Only on mount — later catalog changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A saved cart holds a snapshot of each product. Refresh it from the live
  // catalog so prices/names shown match what the server will charge, and drop
  // bags that were removed or hidden since.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMounted) setCartItems((items) => syncWithCatalog(items, catalog));
  }, [catalog, isMounted]);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("smadar_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        return prevItems.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prevItems, { product, quantity: 1 }];
    });
    setIsOpen(true); // Auto-open cart drawer when adding item
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
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

// Rebuilds the saved cart from the live catalog. Old saved carts could hold the
// same bag on several lines (one per engraving, a feature that no longer
// exists), so lines for the same bag are merged here.
function syncWithCatalog(saved: unknown, catalog: Product[]): CartItem[] {
  if (!Array.isArray(saved)) return [];
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const merged = new Map<string, CartItem>();

  for (const item of saved) {
    const product = byId.get(item?.product?.id);
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) continue;

    const existing = merged.get(product.id);
    merged.set(product.id, {
      product,
      quantity: Math.min((existing?.quantity ?? 0) + quantity, 20),
    });
  }

  return Array.from(merged.values());
}
