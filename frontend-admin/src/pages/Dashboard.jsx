import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token, restaurantId, restaurantStatus } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (restaurantId) api.orders(restaurantId, token).then(setOrders).catch(() => {});
  }, [restaurantId, token]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.placed_at).toDateString() === today);
  const revenue = todayOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === 'placed');

  const itemCounts = {};
  // top-selling requires order_items join; kept simple here using order count as a proxy stat.

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Today at a glance</p>
        </div>
      </div>

      {restaurantStatus && restaurantStatus !== 'active' && (
        <div className="pending-banner">
          <span>
            Your restaurant status is <b>{restaurantStatus}</b>.
            {restaurantStatus === 'pending' && ' It will go live on the customer site once a Super Admin approves it.'}
            {restaurantStatus === 'suspended' && ' Contact platform support to resolve this.'}
          </span>
        </div>
      )}

      {pending.length > 0 && (
        <div className="pending-banner" style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
          <span>🔔 {pending.length} new order(s) waiting for you to accept</span>
          <Link to="/orders" className="btn btn-sm" style={{ background: 'var(--ink)', color: '#fff', border: 'none' }}>Review orders</Link>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card"><div className="label">Today's orders</div><div className="value">{todayOrders.length}</div></div>
        <div className="stat-card"><div className="label">Today's revenue</div><div className="value">₹{revenue.toFixed(0)}</div></div>
        <div className="stat-card"><div className="label">Pending acceptance</div><div className="value">{pending.length}</div></div>
        <div className="stat-card"><div className="label">Total orders (all time)</div><div className="value">{orders.length}</div></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent orders</h3>
        {orders.length === 0 ? (
          <p className="empty-state">No orders yet.</p>
        ) : (
          <table>
            <thead><tr><th>Order</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
            <tbody>
              {orders.slice(0, 8).map((o) => (
                <tr key={o.id}>
                  <td className="order-number">{o.order_number}</td>
                  <td><span className={`badge ${o.status}`}>{o.status.replace(/_/g, ' ')}</span></td>
                  <td>₹{o.total.toFixed(2)}</td>
                  <td>{new Date(o.placed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
