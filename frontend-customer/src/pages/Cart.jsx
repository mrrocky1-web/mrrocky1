import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { lines, updateQty, subtotal, restaurantSlug } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToCheckout = () => {
    if (!user) { navigate('/login?next=/checkout'); return; }
    navigate('/checkout');
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="menu-header"><h1>Your cart</h1></div>

      {lines.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/restaurants" className="btn btn-primary">Browse restaurants</Link>
        </div>
      ) : (
        <>
          {restaurantSlug && (
            <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
              Ordering from <Link to={`/r/${restaurantSlug}`} style={{ fontWeight: 700, color: 'var(--ink)' }}>{restaurantSlug.replace(/-/g, ' ')}</Link>
            </p>
          )}
          <div className="card">
            {lines.map((l) => (
              <div className="cart-line" key={l.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>₹{l.price} each</div>
                </div>
                <div className="qty-stepper">
                  <button onClick={() => updateQty(l.id, l.qty - 1)}>−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => updateQty(l.id, l.qty + 1)}>+</button>
                </div>
              </div>
            ))}
            <div className="summary-row total">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={goToCheckout}>
            Proceed to checkout
          </button>
        </>
      )}
    </div>
  );
}
