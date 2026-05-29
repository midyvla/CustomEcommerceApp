import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
    const { cart, isCartOpen, setCartOpen, clearCart } = useCart();

    // Asynchronous network lifecycle state management
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState<{ orderNumber: string; totalCharged: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

    if (!isCartOpen) return null;

    // The Core Transaction Network Worker
    const handleCheckoutSubmit = async () => {
        if (cart.length === 0) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        // 1. Locate the parent baseline product and isolate secondary checked addon IDs
        const baseProduct = cart.find(item => !item.isAddon);
        const addonProductIds = cart.filter(item => item.isAddon).map(item => item.id);

        if (!baseProduct) {
            setErrorMessage("Transaction aborted: Missing base product initialization context.");
            setIsSubmitting(false);
            return;
        }

        // 2. Package the payload matching your backend CheckoutRequestDto contract
        const checkoutPayload = {
            customerEmail: "customer@example.com", // 
            baseProductId: baseProduct.id,
            selectedAddonProductIds: addonProductIds
        };

        try {
            // 3. Dispatch the transaction details across the network gateway port
            const response = await fetch('http://localhost:5201/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkoutPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Server validation execution failure.');
            }

            // 4. Handle a successful database persistence loop response
            setCheckoutResult({
                orderNumber: result.orderNumber,
                totalCharged: result.totalCharged
            });
            clearCart(); // Flush basket state upon payment commitment
        } catch (err: any) {
            setErrorMessage(err.message || "Network timeout or connection refused.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm transition-opacity" onClick={() => setCartOpen(false)} />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md bg-white shadow-xl flex flex-col h-full border-l border-gray-100">

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">🛒 Your Shopping Bag</h2>
                        <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-500 text-xl p-2">✕</button>
                    </div>

                    {/* Body List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {checkoutResult ? (
                            // Success Confirmation Display Layout
                            <div className="text-center py-12 flex flex-col items-center justify-center h-full space-y-4">
                                <span className="text-5xl">🎉</span>
                                <h3 className="text-xl font-bold text-gray-900">Order Confirmed!</h3>
                                <p className="text-sm text-gray-600">Your transaction was processed successfully.</p>
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl w-full text-left font-mono text-xs text-indigo-900 space-y-1">
                                    <div><span className="font-sans font-bold text-gray-500">Invoice Ref:</span> {checkoutResult.orderNumber}</div>
                                    <div><span className="font-sans font-bold text-gray-500">Amount Charged:</span> ${checkoutResult.totalCharged.toFixed(2)}</div>
                                </div>
                                <button onClick={() => { setCheckoutResult(null); setCartOpen(false); }} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                    Continue Browsing
                                </button>
                            </div>
                        ) : cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center h-full">
                                <span className="text-4xl mb-3">🛍️</span>
                                <p className="text-sm">Your cart feels a bit light right now.</p>
                            </div>
                        ) : (
                            // Active Bag Rendering Loop
                            <>
                                {errorMessage && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg font-medium">
                                        ⚠️ {errorMessage}
                                    </div>
                                )}
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                        <div className="min-w-0 pr-4">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                            {item.isAddon && <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">Addon Price Active</span>}
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 flex-shrink-0">${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Summary Footer */}
                    {!checkoutResult && cart.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                            <div className="flex items-baseline justify-between mb-4">
                                <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                                <span className="text-2xl font-black text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCheckoutSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Processing Transaction...</span>
                                    </>
                                ) : (
                                    <span>Proceed to Checkout</span>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};