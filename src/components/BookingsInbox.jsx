import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BookingsInbox() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setOrders(orders.map(order => order.id === id ? { ...order, status: newStatus } : order));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading live orders...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto my-6">
      <h2 className="text-xl font-bold mb-4">📥 Live Bookings & Food Orders Inbox</h2>
      
      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm">No bookings or orders found yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-sm text-gray-700">
                <th className="p-3">Customer</th>
                <th className="p-3">Type</th>
                <th className="p-3">Details</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      order.booking_type === 'appointment' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.booking_type === 'appointment' ? 'Appointment' : 'Food Order'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800">{order.order_summary}</td>
                  <td className="p-3 font-medium">${Number(order.total_amount).toFixed(2)}</td>
                  <td className="p-3">
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="border p-1 rounded text-xs bg-white font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
