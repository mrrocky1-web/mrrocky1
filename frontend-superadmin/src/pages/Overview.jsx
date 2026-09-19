import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Overview() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { api.analytics(token).then(setData).catch(() => {}); }, [token]);

  if (!data) return <div className="empty-state">Loading analytics…</div>;

  const statusCount = (status) => data.restaurantCounts.find((r) => r.status === status)?.count || 0;

  return (
    <div>
      <div className="page-head"><div><h1>Platform overview</h1><p>Orders, revenue, and restaurant health across the network</p></div></div>

      <div className="stat-grid">
        <div className="stat-card"><div className="label">Delivered orders</div><div className="value">{data.totals.total_orders}</div></div>
        <div className="stat-card"><div className="label">Total revenue</div><div className="value">₹{Number(data.totals.total_revenue).toFixed(0)}</div></div>
        <div className="stat-card"><div className="label">Active restaurants</div><div className="value">{statusCount('active')}</div></div>
        <div className="stat-card"><div className="label">Pending approval</div><div className="value">{statusCount('pending')}</div></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Top restaurants by revenue</h3>
        {data.topRestaurants.length === 0 ? <p className="empty-state">No delivered orders yet.</p> : (
          <table>
            <thead><tr><th>Restaurant</th><th>City</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.topRestaurants.map((r, i) => (
                <tr key={i}><td>{r.name}</td><td>{r.city}</td><td>{r.order_count}</td><td>₹{Number(r.revenue).toFixed(0)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>City-wise performance</h3>
        {data.cityPerformance.length === 0 ? <p className="empty-state">No data yet.</p> : (
          <table>
            <thead><tr><th>City</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.cityPerformance.map((c, i) => (
                <tr key={i}><td>{c.city || '—'}</td><td>{c.order_count}</td><td>₹{Number(c.revenue).toFixed(0)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
