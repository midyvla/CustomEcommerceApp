import React from 'react';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
    const { cart, setCartOpen } = useCart();

    // Aggregate the total quantity of items currently committed to the bag
    const totalItems = cart.length;

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-40 px-6 flex items-center justify-between shadow-sm/50">

            {/* Brand Identity / Logo */}
            <div className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    APEX
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-200/60 px-1.5 py-0.5 rounded">
                    Portal
                </span>
            </div>

            {/* Interactive Global Utility Links / Actions */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => setCartOpen(true)}
                    className="relative p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all focus:outline-none flex items-center justify-center group"
                    aria-label="Open Shopping Cart"
                >
                    {/* Minimalist Vector Shopping Bag Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="w-5 h-5 group-hover:scale-105 transition-transform"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                    </svg>

                    {/* Dynamic Floating Notification Badge */}
                    {totalItems > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in-50 duration-200">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>

        </nav>
    );
};