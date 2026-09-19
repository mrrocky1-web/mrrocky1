import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const LABELS = { placed: 'Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'On the way', delivered: 'Delivered' };

export default function OrderTracking() {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    const fetchOrder = () => {
      api.getOrder(orderId, token).then(setOrder).catch((e) => setError(e.message));
    };
    fetchOrder();
    interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  if (error) return <div className="container empty-state"><p>{error}</p></div>;
  if (!order) return <div className="container empty-state"><p>Loading order…</p></div>;

  const isTerminalBad = order.status === 'cancelled' || order.status === 'rejected';
  const currentIdx = STEPS.indexOf(order.status);

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="menu-header">
        <h1 style={{ fontSize: 32 }}>Order {order.order_number}</h1>
      </div>

      {isTerminalBad ? (
        <div className="error-banner">This order was {order.status}.</div>
      ) : (
        <div className="status-track">
          {STEPS.map((s, i) => (
            <div className={`status-step ${i <= currentIdx ? 'done' : ''}`} key={s}>
              <div className="status-dot" />
              {LABELS[s]}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {order.items.map((it) => (
          <div className="cart-line" key={it.id}>
            <span>{it.qty} × {it.name_snapshot}</span>
            <span>₹{it.line_total.toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
        {order.discount > 0 && <div className="summary-row"><span>Discount</span><span>-₹{order.discount.toFixed(2)}</span></div>}
        <div className="summary-row"><span>Delivery fee</span><span>₹{order.delivery_fee.toFixed(2)}</span></div>
        <div className="summary-row"><span>Tax</span><span>₹{order.tax.toFixed(2)}</span></div>
        <div className="summary-row total"><span>Total</span><span>₹{order.total.toFixed(2)}</span></div>
      </div>

      <Link to="/account" className="btn" style={{ marginTop: 20 }}>Back to my orders</Link>
    </div>
  );
}
