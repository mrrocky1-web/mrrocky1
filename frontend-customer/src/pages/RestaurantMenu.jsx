import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';

export default function RestaurantMenu() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [error, setError] = useState('');
  const { lines, addItem, updateQty } = useCart();

  useEffect(() => {
    api.getRestaurant(slug)
      .then((d) => { setData(d); setActiveCat(d.menu[0]?.id); })
      .catch(() => setError('Restaurant not found.'));
  }, [slug]);

  if (error) return <div className="container"><p className="empty-state">{error}</p></div>;
  if (!data) return <div className="container"><p className="empty-state">Loading menu…</p></div>;

  const { restaurant, menu } = data;
  const activeItems = menu.find((c) => c.id === activeCat)?.items || [];
  const qtyFor = (itemId) => lines.find((l) => l.id === itemId)?.qty || 0;

  return (
    <div className="container">
      <div className="menu-header">
        <h1>{restaurant.name}</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>{restaurant.address}</p>
      </div>

      <div className="category-tabs">
        {menu.map((c) => (
          <button key={c.id} className={c.id === activeCat ? 'active' : ''} onClick={() => setActiveCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {activeItems.length === 0 ? (
        <p className="empty-state">No items in this category yet.</p>
      ) : (
        <div>
          {activeItems.map((item) => {
            const qty = qtyFor(item.id);
            return (
              <div className="menu-item-row" key={item.id}>
                <div className="menu-item-info">
                  <h4>
                    <span className={`veg-dot ${item.veg_flag !== 'veg' ? 'nonveg' : ''}`} />
                    {item.name}
                  </h4>
                  <p>{item.description}</p>
                  <div className="menu-item-price">₹{item.price}</div>
                  {!item.is_available ? (
                    <span style={{ color: 'var(--chili)', fontWeight: 700, fontSize: 13 }}>Currently unavailable</span>
                  ) : qty > 0 ? (
                    <div className="qty-stepper" style={{ marginTop: 8 }}>
                      <button onClick={() => updateQty(item.id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => updateQty(item.id, qty + 1)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" style={{ marginTop: 8 }} onClick={() => addItem(slug, { id: item.id, name: item.name, price: item.price })}>
                      ADD
                    </button>
                  )}
                </div>
                {item.image_url && <img className="menu-item-img" src={item.image_url} alt={item.name} />}
              </div>
            );
          })}
        </div>
      )}

      {lines.length > 0 && (
        <div style={{ position: 'sticky', bottom: 20, marginTop: 30 }}>
          <Link to="/cart" className="btn btn-primary btn-full">
            View cart — {lines.reduce((s, l) => s + l.qty, 0)} item(s)
          </Link>
        </div>
      )}
    </div>
  );
}
