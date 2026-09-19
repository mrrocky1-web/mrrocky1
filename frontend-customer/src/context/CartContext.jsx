import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [restaurantSlug, setRestaurantSlug] = useState(() => localStorage.getItem('kb_cart_restaurant') || null);
  const [lines, setLines] = useState(() => {
    const raw = localStorage.getItem('kb_cart_lines');
    return raw ? JSON.parse(raw) : [];
  });

  const persist = (slug, newLines) => {
    localStorage.setItem('kb_cart_restaurant', slug || '');
    localStorage.setItem('kb_cart_lines', JSON.stringify(newLines));
    setRestaurantSlug(slug);
    setLines(newLines);
  };

  const addItem = useCallback((slug, item, qty = 1) => {
    if (restaurantSlug && restaurantSlug !== slug && lines.length) {
      const confirmed = window.confirm('Your cart has items from another restaurant. Clear it and add this item instead?');
      if (!confirmed) return;
      persist(slug, [{ ...item, qty }]);
      return;
    }
    const existingIdx = lines.findIndex((l) => l.id === item.id);
    let newLines;
    if (existingIdx >= 0) {
      newLines = [...lines];
      newLines[existingIdx] = { ...newLines[existingIdx], qty: newLines[existingIdx].qty + qty };
    } else {
      newLines = [...lines, { ...item, qty }];
    }
    persist(slug, newLines);
  }, [lines, restaurantSlug]);

  const updateQty = useCallback((itemId, qty) => {
    if (qty <= 0) {
      const newLines = lines.filter((l) => l.id !== itemId);
      persist(newLines.length ? restaurantSlug : null, newLines);
    } else {
      persist(restaurantSlug, lines.map((l) => (l.id === itemId ? { ...l, qty } : l)));
    }
  }, [lines, restaurantSlug]);

  const clearCart = useCallback(() => persist(null, []), []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines]
  );

  return (
    <CartContext.Provider value={{ restaurantSlug, lines, addItem, updateQty, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
