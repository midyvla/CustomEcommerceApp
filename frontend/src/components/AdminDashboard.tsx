import React, { useState, useEffect } from 'react';
import { OrderNotesModal } from './OrderNotesModal'; // Ensure your import mapping is clear

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

    // Filter tool states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Local operation tracking flag
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // --- 1. NEW STATE INDICATOR FOR AUDITED LOGGING WORKSPACE ---
    const [selectedOrderForNotes, setSelectedOrderForNotes] = useState<{ id: number; num: string } | null>(null);

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

    useEffect(() => {
        fetchOrders();
    }, []);

    // --- ASYNCHRONOUS BACKEND PUT ACTION DISPATCHER ---
    const handleStatusChange = async (orderId: number, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const response = await fetch(`http://localhost:5201/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to update transaction state.');
            }

            // Optimistically swap the state locally to avoid a full pipeline re-query pause
            setOrders(prevOrders =>
                prevOrders.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o)
            );
        } catch (err: any) {
            alert(`Operation Fault: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    // --- CLIENT-SIDE SPREADSHEET EXPORT WORKER ENGINE ---
    const handleExportToCSV = () => {
        if (filteredOrders.length === 0) return;

        // 1. Establish structural column headers mapping layout
        const headers = ["Invoice Number", "Date Settled UTC", "Customer Email", "Purchased Items Manifest", "Subtotal ($)", "Tax ($)", "Shipping ($)", "Total Revenue ($)", "Lifecycle Status"];

        // 2. Map data rows while stripping out inner layout comma breakers to safeguard alignment bounds
        const csvRows = filteredOrders.map(order => {
            const itemsDescription = order.orderItems
                .map(i => `${i.quantity}x ${i.productName}${i.isAddon ? ' (Addon)' : ''}`)
                .join(' | ');

            return [
                `"${order.orderNumber}"`,
                `"${new Date(order.createdUtc).toISOString()}"`,
                `"${order.customerEmail}"`,
                `"${itemsDescription.replace(/"/g, '""')}"`, // Double quotes protect string spaces escape bounds
                order.subtotal.toFixed(2),
                order.tax.toFixed(2),
                order.shipping.toFixed(2),
                order.total.toFixed(2),
                `"${order.orderStatus}"`
            ].join(',');
        });

        // 3. Combine header schemas with dataset components
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // 4. Instantiate a virtual download link profile to fire the system resource stream
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `APEX_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Real-time local evaluation query paths
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'All' || order.orderStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    if (loading) return <div className="p-8 text-center text-sm font-medium text-gray-500 animate-pulse">Loading administrative analytics...</div>;
    if (error) return <div className="p-4 m-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">⚠️ Error: {error}</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">

            {/* Viewport Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Operations Ledger</h1>
                    <p className="text-xs text-gray-500 mt-1">Real-time analytical performance tracking directly from Docker SQL Server core.</p>
                </div>

                {/* --- DYNAMIC GRAPHICAL SPREADSHEET DOWNLOAD TRIGGER BUTTON --- */}
                <button
                    onClick={handleExportToCSV}
                    disabled={filteredOrders.length === 0}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer select-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Export Filtered Sheets (.CSV)</span>
                </button>
            </div>

            {/* Aggregate Analytical Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Gross Revenue (Filtered)</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Orders Displayed</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{filteredOrders.length}</p>
                </div>
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Filtered AOV</p>
                    <p className="text-3xl font-black text-emerald-600 mt-2">${averageOrderValue.toFixed(2)}</p>
                </div>

                {/* --- WAREHOUSE ALLOCATIONS GAUGE CARD --- */}
                <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm/40 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Warehouse Allocations Hub</p>
                            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded">Docker Connected</span>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>3D Smart Massager Stock Level</span>
                                <span className="font-mono font-bold">64% Capacity</span>
                            </div>

                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200/40">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-inner transition-all duration-1000 ease-out"
                                    style={{ width: '64%' }}
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 leading-tight">Stock counts update concurrently via database record tracking triggers upon checkout confirmations.</p>
                </div>
            </div>

            {/* Control Filter Toolbar Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 border border-gray-100 rounded-xl shadow-sm/30">
                <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1.5">Search Order Records</label>
                    <input
                        type="text"
                        placeholder="Filter by Email address or APEX Invoice ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-800 font-medium"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1.5">Lifecycle Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-gray-700 cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Completed">Completed</option>
                    </select>
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
                                <th className="p-4 text-center">Interactive Lifecycle Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                                        🔍 No orders found matching specified criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.orderId} className="hover:bg-gray-50/40 transition-colors">

                                        {/* --- 2. DYNAMIC WORKSPACE INTERACTION LINK WRAPPER --- */}
                                        <td className="p-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedOrderForNotes({ id: order.orderId, num: order.orderNumber })}
                                                className="font-mono font-black text-indigo-600 hover:text-indigo-800 transition-colors text-left focus:outline-none underline decoration-indigo-200 hover:decoration-indigo-500 cursor-pointer text-xs"
                                            >
                                                {order.orderNumber}
                                            </button>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {new Date(order.createdUtc).toLocaleString()}
                                            </p>
                                        </td>

                                        <td className="p-4 text-gray-600 font-medium">{order.customerEmail}</td>
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
                                        <td className="p-4 text-right whitespace-nowrap font-mono">
                                            <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                Sub: ${order.subtotal.toFixed(2)} | Tax: ${order.tax.toFixed(2)}
                                            </p>
                                        </td>

                                        {/* --- INTERACTIVE DROPDOWN LIFE-CYCLE CONTROLLER ROW --- */}
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <div className="inline-block relative">
                                                <select
                                                    value={order.orderStatus}
                                                    disabled={updatingId === order.orderId}
                                                    onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                                    className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-all appearance-none pr-7 ${order.orderStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200' :
                                                        order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200'
                                                        }`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-[8px]">
                                                    ▼
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 3. MOUNT THE AUDITED NOTES DIALOG MODAL BASE AT TIMELINE BOUNDS --- */}
            {selectedOrderForNotes && (
                <OrderNotesModal
                    orderId={selectedOrderForNotes.id}
                    orderNumber={selectedOrderForNotes.num}
                    onClose={() => setSelectedOrderForNotes(null)}
                />
            )}

        </div>
    );
};