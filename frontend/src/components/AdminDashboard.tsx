import React, { useState, useEffect } from 'react';

interface OrderItem {
    orderItemId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    isAddon: boolean;
}

interface Order {
    orderId: number;
    orderNumber: string;
    customerEmail: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    createdUtc: string;
    orderStatus: string;
    orderItems: OrderItem[];
}

export const AdminDashboard: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('http://localhost:5201/api/orders');
                if (!response.ok) throw new Error('Failed to retrieve system order logs.');
                const data = await response.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message || 'Network connectivity fault.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Compute aggregate administrative metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    if (loading) return <div className="p-8 text-center text-sm font-medium text-gray-500 animate-pulse">Loading administrative analytics...</div>;
    if (error) return <div className="p-4 m-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">⚠️ Error: {error}</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">

            {/* Viewport Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Operations Ledger</h1>
                    <p className="text-xs text-gray-500 mt-1">Real-time analytical performance tracking directly from Docker SQL Server core.</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    Live Sync Active
                </span>
            </div>

            {/* Aggregate Analytical Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Gross System Revenue</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders Settled</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Average Order Value (AOV)</p>
                    <p className="text-3xl font-black text-emerald-600 mt-2">${averageOrderValue.toFixed(2)}</p>
                </div>
            </div>

            {/* Primary Orders Data Table */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="p-4">Order Ref / Date</th>
                                <th className="p-4">Customer Email</th>
                                <th className="p-4">Items Manifest</th>
                                <th className="p-4 text-right">Financial Breakdown</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">No transactions recorded in database log yet.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.orderId} className="hover:bg-gray-50/40 transition-colors">
                                        {/* Order Reference */}
                                        <td className="p-4 whitespace-nowrap">
                                            <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {new Date(order.createdUtc).toLocaleString()}
                                            </p>
                                        </td>

                                        {/* Email */}
                                        <td className="p-4 text-gray-600 font-medium">{order.customerEmail}</td>

                                        {/* Manifest */}
                                        <td className="p-4 max-w-xs">
                                            <div className="space-y-1">
                                                {order.orderItems.map((item) => (
                                                    <div key={item.orderItemId} className="flex items-center text-xs text-gray-700">
                                                        <span className="w-4 font-bold text-gray-400">{item.quantity}x</span>
                                                        <span className="truncate flex-1 pr-2">{item.productName}</span>
                                                        {item.isAddon && (
                                                            <span className="text-[9px] font-extrabold text-green-700 bg-green-50 px-1 rounded flex-shrink-0">
                                                                ADDON
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Financials */}
                                        <td className="p-4 text-right whitespace-nowrap font-mono">
                                            <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                Sub: ${order.subtotal.toFixed(2)} | Tax: ${order.tax.toFixed(2)}
                                            </p>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-md">
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};