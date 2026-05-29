import React, { createContext, useContext, useState } from 'react';

// Define the shape of an individual cart line item
// Ensure 'export' is added right before the interface keyword!
export interface CartItem {
    id: number;
    name: string;
    price: number;
    isAddon: boolean;
    parentName?: string;
}

interface CartContextType {
    cart: CartItem[];
    isCartOpen: boolean;
    addToCart: (items: CartItem[]) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
    setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

    const addToCart = (newItems: CartItem[]) => {
        setCart((prevCart) => {
            // Basic deduplication to ensure the same item isn't stacked repeatedly
            const existingIds = prevCart.map(item => item.id);
            const uniqueNewItems = newItems.filter(item => !existingIds.includes(item.id));
            return [...prevCart, ...uniqueNewItems];
        });
        setIsCartOpen(true); // Automatically slide out the drawer when an offer is claimed!
    };

    const removeFromCart = (id: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, isCartOpen, addToCart, removeFromCart, clearCart, setCartOpen: setIsCartOpen }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be executed within a valid CartProvider element boundary.');
    return context;
};