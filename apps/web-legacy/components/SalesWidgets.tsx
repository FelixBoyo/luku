import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { supabase } from '../services/supabaseClient';

interface SalesWidgetsProps {
    businessId: string;
}

const SalesWidgets: React.FC<SalesWidgetsProps> = ({ businessId }) => {
    const { orders } = useAppSelector((state) => state.orders);
    const [todaySales, setTodaySales] = useState({ revenue: 0, orders: 0 });
    const [weekSales, setWeekSales] = useState({ revenue: 0, orders: 0 });
    const [topProduct, setTopProduct] = useState<{ name: string; sales: number } | null>(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);

                // Today's sales
                const { data: todayOrders } = await supabase
                    .from('orders')
                    .select('total_price')
                    .eq('seller_id', businessId)
                    .gte('created_at', todayStart.toISOString());

                const todayRevenue = todayOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
                setTodaySales({ revenue: todayRevenue, orders: todayOrders?.length || 0 });

                // This week's sales
                const { data: weekOrders } = await supabase
                    .from('orders')
                    .select('total_price')
                    .eq('seller_id', businessId)
                    .gte('created_at', weekStart.toISOString());

                const weekRevenue = weekOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
                setWeekSales({ revenue: weekRevenue, orders: weekOrders?.length || 0 });

                // Top selling product today
                const { data: productSales } = await supabase
                    .from('orders')
                    .select('product_id, quantity')
                    .eq('seller_id', businessId)
                    .gte('created_at', todayStart.toISOString());

                if (productSales && productSales.length > 0) {
                    const salesMap = new Map<string, number>();
                    productSales.forEach((order) => {
                        const current = salesMap.get(order.product_id) || 0;
                        salesMap.set(order.product_id, current + order.quantity);
                    });

                    const topProductId = Array.from(salesMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
                    if (topProductId) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('name')
                            .eq('id', topProductId)
                            .single();

                        if (product) {
                            setTopProduct({
                                name: product.name,
                                sales: salesMap.get(topProductId) || 0,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch sales data:', error);
            }
        };

        fetchSalesData();
    }, [businessId]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 mb-1">Today's Revenue</p>
                <p className="text-2xl font-bold">${todaySales.revenue.toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">{todaySales.orders} {todaySales.orders === 1 ? 'order' : 'orders'}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 mb-1">This Week</p>
                <p className="text-2xl font-bold">${weekSales.revenue.toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">{weekSales.orders} {weekSales.orders === 1 ? 'order' : 'orders'}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 mb-1">Top Product Today</p>
                <p className="text-lg font-bold truncate">{topProduct?.name || 'N/A'}</p>
                <p className="text-xs opacity-75 mt-1">{topProduct ? `${topProduct.sales} sold` : 'No sales yet'}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold">
                    {orders.filter((o) => o.status === 'pending').length}
                </p>
                <p className="text-xs opacity-75 mt-1">Requires attention</p>
            </div>
        </div>
    );
};

export default SalesWidgets;
