import { CartProvider } from './context/CartContext';
import { CrossSellBundle } from './components/CrossSellBundle';
import { CartDrawer } from './components/CartDrawer';
import { Navbar } from './components/Navbar';

function App() {
    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50/50">
                {/* Global Navigation Shell */}
                <Navbar />

                {/* Main Content Layout Block */}
                <main className="flex items-center justify-center p-4 pt-20 min-h-[calc(100vh-4rem)]">
                    <CrossSellBundle productId={1} />
                </main>

                {/* Global Interactive Elements */}
                <CartDrawer />
            </div>
        </CartProvider>
    );
}

export default App;