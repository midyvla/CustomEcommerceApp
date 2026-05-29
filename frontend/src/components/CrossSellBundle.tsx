import React, { useState, useEffect } from 'react';
import { useBundle } from '../hooks/useBundle';
import type { CartItem } from '../context/CartContext';

interface CrossSellBundleProps {
  productId: number;
}

export const CrossSellBundle: React.FC<CrossSellBundleProps> = ({ productId }) => {


  // 1. Fetch real-time SQL data across our network bridge
  const { data: product, loading, error } = useBundle(productId);

  // 2. State array tracking which companion product IDs have been selected by the user
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // 3. Keep calculations and totals fully synced as checkboxes are toggled
  useEffect(() => {
    if (!product) return;

    let cost = product.basePrice;

    product.crossSells.forEach((addon) => {
      if (selectedAddons.includes(addon.productId)) {
        cost += addon.bundlePrice;
      }
    });

    setTotalPrice(cost);
  }, [selectedAddons, product]);

  // Handle individual checkbox selection shifts
  const toggleAddon = (id: number) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((addonId) => addonId !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md max-w-xl mx-auto my-8">
        <p className="font-semibold">Failed to load product configuration.</p>
        <p className="text-sm">{error || 'Product context missing.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 my-8 bg-white rounded-xl shadow-sm border border-gray-100">
      
      {/* Visual Product Mockup Column */}
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 border border-indigo-100/50">
        <div className="w-48 h-48 bg-white rounded-full shadow-md flex items-center justify-center text-6xl mb-4">
          💆‍♂️
        </div>
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-100/60 px-2.5 py-1 rounded-full">
          {product.sku}
        </span>
      </div>

      {/* Main Purchasing Controls Column */}
      <div className="flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">${product.basePrice.toFixed(2)}</p>
          <p className="text-gray-600 mt-4 text-sm leading-relaxed">{product.description}</p>
          
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full mr-2 ${product.stockQuantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {product.stockQuantity} items ready to ship from warehouse
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Dynamic Interactive Cross-Sell Bundling Block */}
          {product.crossSells.length > 0 && (
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-gray-400">Frequently Bought Together (Save Big)</h3>
              <div className="space-y-3 mt-3">
                {product.crossSells.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.productId);
                  return (
                    <label 
                      key={addon.productId}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                      }`}
                    >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 flex-shrink-0"
                                  checked={isChecked}
                                  onChange={() => toggleAddon(addon.productId)}
                              />
                              <div className="min-w-0 pr-4"> {/* Added padding-right and overflow protection */}
                                  <p className="text-sm font-semibold text-gray-800 truncate">{addon.name}</p>
                                  <p className="text-xs text-green-600 font-medium">
                                      Save {addon.discountPercentage.toFixed(0)}% when added right now
                                  </p>
                              </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                              <span className="text-sm font-bold text-gray-900">${addon.bundlePrice.toFixed(2)}</span>
                              <span className="text-xs text-gray-400 line-through block">${addon.originalPrice.toFixed(2)}</span>
                          </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Real-Time Checkout Summary Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-500">Total Bundle Cost:</span>
            <span className="text-3xl font-black text-gray-900 tracking-tight">${totalPrice.toFixed(2)}</span>
          </div>
                  <button
                      onClick={() => {
                          if (!product) return;

                          // 1. Package the parent product shape configuration
                          const itemsToBag: CartItem[] = [{
                              id: product.productId,
                              name: product.name,
                              price: product.basePrice,
                              isAddon: false
                          }];

                          // 2. Append any active checked auxiliary cross-sells
                          product.crossSells.forEach(addon => {
                              if (selectedAddons.includes(addon.productId)) {
                                  itemsToBag.push({
                                      id: addon.productId,
                                      name: addon.name,
                                      price: addon.bundlePrice,
                                      isAddon: true
                                  });
                              }
                          });

                          // 3. Commit packages to global context memory
                          addToCart(itemsToBag);
                      }}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      Claim This Bundle Offer
                  </button>
        </div>

      </div>
    </div>
  );
};