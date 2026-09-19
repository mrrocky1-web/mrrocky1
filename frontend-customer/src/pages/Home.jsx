import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    api.listRestaurants().then(setRestaurants).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Hot food,<br />ordered your way.</h1>
          <p>Browse the menu, pick your spot — delivery, pickup, or dine-in — and track every order from grill to doorstep.</p>
          <Link to="/restaurants" className="btn btn-primary">See what's open near you</Link>
        </div>
      </section>

      <div className="container">
        <div className="menu-header">
          <h1 style={{ fontSize: 30 }}>Popular right now</h1>
        </div>
        {restaurants.length === 0 ? (
          <p className="empty-state">No restaurants live yet — check back soon.</p>
        ) : (
          <div className="rest-grid">
            {restaurants.map((r) => (
              <Link to={`/r/${r.slug}`} key={r.id} className="rest-card">
                <img src={r.banner_url || 'https://placehold.co/400x200?text=' + r.name} alt={r.name} />
                <div className="rest-card-body">
                  <h3>{r.name}</h3>
                  <div className="rest-meta">
                    <span>{r.city}</span>
                    {r.avg_rating && <span>★ {r.avg_rating} ({r.review_count})</span>}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {r.cuisine_tags.map((t) => <span className="tag" key={t}>{t.replace('_', ' ')}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
