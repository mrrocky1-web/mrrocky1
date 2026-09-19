import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = search ? { search } : {};
    const t = setTimeout(() => {
      api.listRestaurants(params).then(setRestaurants).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="container">
      <div className="menu-header">
        <h1>Find a spot</h1>
      </div>
      <div className="search-row">
        <input
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {restaurants.length === 0 ? (
        <p className="empty-state">No matches. Try a different search.</p>
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
