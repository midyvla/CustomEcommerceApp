import React from 'react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
    const { cart, isCartOpen, setCartOpen, removeFromCart } = useCart();

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Semi-transparent blur overlay backdrop */}
            <div
                className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm transition-opacity"
                onClick={() => setCartOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md bg-white shadow-xl flex flex-col h-full border-l border-gray-100">

                    {/* Drawer Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            🛒 Your Shopping Bag
                            <span className="ml-2.5 text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">
                                {cart.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setCartOpen(false)}
                            className="text-gray-400 hover:text-gray-500 text-xl font-medium p-2 focus:outline-none"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Core Line Items List Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center h-full">
                                <span className="text-4xl mb-3">🛍️</span>
                                <p className="text-sm">Your cart feels a bit light right now.</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                        {item.isAddon && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                Bundle Deal Save Rate Applied
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4 flex-shrink-0">
                                        <span className="text-sm font-bold text-gray-900">${item.price.toFixed(2)}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline bg-red-50 hover:bg-red-100/60 p-2 rounded-md transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Drawer Summary Footer */}
                    {cart.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                            <div className="flex items-baseline justify-between mb-4">
                                <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                                <span className="text-2xl font-black text-gray-900 tracking-tight">${subtotal.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">Shipping and tax options calculated dynamically at validation steps.</p>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all transform active:scale-[0.99]">
                                Proceed to Checkout
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};