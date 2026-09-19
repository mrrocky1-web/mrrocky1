import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const TRANSITIONS = {
  placed: [['accepted', 'Accept'], ['rejected', 'Reject']],
  accepted: [['preparing', 'Start preparing'], ['cancelled', 'Cancel']],
  preparing: [['ready', 'Mark ready'], ['cancelled', 'Cancel']],
  ready: [['out_for_delivery', 'Out for delivery'], ['delivered', 'Delivered (pickup/dine-in)']],
  out_for_delivery: [['delivered', 'Mark delivered']],
  delivered: [],
  cancelled: [],
  rejected: [],
};

const FILTERS = ['all', 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function Orders() {
  const { token, restaurantId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = () => {
    api.orders(restaurantId, token, filter === 'all' ? undefined : filter).then(setOrders).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [restaurantId, token, filter]);

  const changeStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status, token);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div><h1>Orders</h1><p>Accept, prepare, and dispatch incoming orders</p></div>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        {orders.length === 0 ? (
          <p className="empty-state">No orders in this view.</p>
        ) : (
          <table>
            <thead><tr><th>Order</th><th>Type</th><th>Status</th><th>Total</th><th>Placed</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="order-number">{o.order_number}</td>
                  <td>{o.delivery_type.replace('_', ' ')}</td>
                  <td><span className={`badge ${o.status}`}>{o.status.replace(/_/g, ' ')}</span></td>
                  <td>₹{o.total.toFixed(2)}</td>
                  <td>{new Date(o.placed_at).toLocaleTimeString()}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TRANSITIONS[o.status].map(([status, label]) => (
                      <button key={status} className="btn btn-sm" onClick={() => changeStatus(o.id, status)}>{label}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
