import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CartContext, type CartContextValue, type CartItem } from './cartStore';

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from local storage.`, error);
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStored('voguee-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStored('voguee-wishlist', []));
  const [couponApplied, setCouponApplied] = useState<boolean>(() => readStored('voguee-coupon', false));

  useEffect(() => {
    localStorage.setItem('voguee-cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('voguee-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('voguee-coupon', JSON.stringify(couponApplied));
  }, [couponApplied]);

  const addItem: CartContextValue['addItem'] = (item) => {
    const id = [item.productId, item.size ?? '', item.color ?? ''].join(':');
    setItems((current) => {
      const existing = current.find((cartItem) => cartItem.id === id);
      return existing
        ? current.map((cartItem) => cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)
        : [...current, { ...item, id, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) setCouponApplied(false);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{
      items,
      wishlist,
      couponApplied,
      addItem,
      removeItem,
      updateQuantity,
      clearCart: () => {
        setItems([]);
        setCouponApplied(false);
      },
      setCouponApplied,
      toggleWishlist,
      total,
    }}>
      {children}
    </CartContext.Provider>
  );
}
