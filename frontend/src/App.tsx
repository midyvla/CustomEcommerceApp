import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CrossSellBundle } from './components/CrossSellBundle';
import { CartDrawer } from './components/CartDrawer';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
    // Simple administrative routing simulator view flag
    const [isAdminView, setIsAdminView] = useState<boolean>(false);

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50/50">
                <Navbar />

                {/* View Toggle Bar */}
                <div className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur border border-gray-200 rounded-lg p-1.5 shadow-md flex space-x-1">
                    <button
                        onClick={() => setIsAdminView(false)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${!isAdminView ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        🛒 Storefront View
                    </button>
                    <button
                        onClick={() => setIsAdminView(true)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${isAdminView ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📊 Admin Panel
                    </button>
                </div>

                {/* View Routing Render Block */}
                <main className="p-4 pt-24 min-h-[calc(100vh-4rem)]">
                    {isAdminView ? (
                        <AdminDashboard />
                    ) : (
                        <div className="flex items-center justify-center">
                            <CrossSellBundle productId={1} />
                        </div>
                    )}
                </main>

                <CartDrawer />
            </div>
        </CartProvider>
    );
}

export default App;