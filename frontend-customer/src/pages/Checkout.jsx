import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const DELIVERY_FEE_ESTIMATE = 40;
const TAX_RATE = 0.05;

export default function Checkout() {
  const { lines, subtotal, restaurantSlug, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!restaurantSlug) return;
    api.getRestaurant(restaurantSlug).then((d) => setRestaurant(d.restaurant)).catch(() => {});
  }, [restaurantSlug]);

  if (!lines.length) {
    return <div className="container empty-state"><p>Your cart is empty.</p></div>;
  }

  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE_ESTIMATE : 0;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const estimatedTotal = +(subtotal + deliveryFee + tax).toFixed(2);

  const placeOrder = async () => {
    if (deliveryType === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (!restaurant) return;
    setPlacing(true);
    setError('');
    try {
      const order = await api.placeOrder(
        {
          restaurant_id: restaurant.id,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          coupon_code: couponCode || undefined,
          notes: deliveryType === 'delivery' ? address : undefined,
          items: lines.map((l) => ({ menu_item_id: l.id, qty: l.qty })),
        },
        token
      );
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="menu-header"><h1>Checkout</h1></div>
      {error && <div className="error-banner">{error}</div>}

      <div className="toggle-row">
        {['delivery', 'pickup', 'dine_in'].map((t) => (
          <button key={t} className={deliveryType === t ? 'active' : ''} onClick={() => setDeliveryType(t)}>
            {t === 'dine_in' ? 'Dine-in' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {deliveryType === 'delivery' && (
        <div className="form-field">
          <label>Delivery address</label>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, landmark, city" />
        </div>
      )}

      <div className="form-field">
        <label>Coupon code (optional)</label>
        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME50" />
      </div>

      <div className="form-field">
        <label>Payment method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cod">Cash on delivery</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        {paymentMethod !== 'cod' && (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            Demo build — online payment gateway (Razorpay/Stripe) integration goes here.
          </p>
        )}
      </div>

      <div className="card">
        <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="summary-row"><span>Delivery fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
        <div className="summary-row"><span>Tax (est.)</span><span>₹{tax.toFixed(2)}</span></div>
        <div className="summary-row total"><span>Estimated total</span><span>₹{estimatedTotal.toFixed(2)}</span></div>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Coupon discount applied server-side at checkout.</p>
      </div>

      <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={placeOrder} disabled={placing}>
        {placing ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  );
}
