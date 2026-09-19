import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">KING<span>BURGER</span></Link>
        <div className="nav-links">
          <Link to="/restaurants">Restaurants</Link>
          {user ? (
            <>
              <Link to="/account">My Orders</Link>
              <button className="btn" onClick={logout} style={{ padding: '6px 14px', fontSize: 13 }}>Log out</button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
          <Link to="/cart" className="cart-pill">Cart {count > 0 ? `(${count})` : ''}</Link>
        </div>
      </div>
    </nav>
  );
}
