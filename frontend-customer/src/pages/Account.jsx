import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (token) api.myOrders(token).then(setOrders).catch(() => {});
  }, [token]);

  if (!user) {
    return (
      <div className="container empty-state">
        <p>Log in to see your order history.</p>
        <Link to="/login?next=/account" className="btn btn-primary">Log in</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="menu-header"><h1>My orders</h1></div>
      {orders.length === 0 ? (
        <p className="empty-state">No orders yet. Time to fix that.</p>
      ) : (
        orders.map((o) => (
          <Link to={`/orders/${o.id}`} key={o.id} className="card" style={{ display: 'block', marginBottom: 14 }}>
            <div className="cart-line" style={{ border: 'none', padding: 0 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{o.order_number}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(o.placed_at).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>₹{o.total.toFixed(2)}</div>
                <span className="tag">{o.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
