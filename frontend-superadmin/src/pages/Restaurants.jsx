import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const TABS = ['all', 'pending', 'active', 'suspended', 'rejected'];

export default function Restaurants() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [tab, setTab] = useState('pending');
  const [editing, setEditing] = useState(null);
  const [billingForm, setBillingForm] = useState({ subscription_plan: '', commission_pct: '', monthly_fee: '' });

  const load = () => api.restaurants(token, tab === 'all' ? undefined : tab).then(setRestaurants).catch(() => {});
  useEffect(() => { load(); }, [tab, token]);

  const setStatus = async (id, status) => {
    if (status === 'suspended' && !window.confirm('Suspend this restaurant? It will disappear from the customer site.')) return;
    await api.setRestaurantStatus(id, status, token);
    load();
  };

  const startEditBilling = (r) => {
    setEditing(r.id);
    setBillingForm({ subscription_plan: r.subscription_plan, commission_pct: r.commission_pct, monthly_fee: r.monthly_fee });
  };

  const saveBilling = async (id) => {
    await api.setBilling(id, {
      subscription_plan: billingForm.subscription_plan,
      commission_pct: parseFloat(billingForm.commission_pct),
      monthly_fee: parseFloat(billingForm.monthly_fee),
    }, token);
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this restaurant and all its data? This cannot be undone.')) return;
    await api.deleteRestaurant(id, token);
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Restaurants</h1><p>Approve signups, manage billing, and control access</p></div></div>

      <div className="tabs">
        {TABS.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {restaurants.length === 0 ? (
        <div className="card"><p className="empty-state">No restaurants in this view.</p></div>
      ) : (
        restaurants.map((r) => (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name} <span className={`badge ${r.status}`} style={{ marginLeft: 8 }}>{r.status}</span></div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{r.city || 'No city set'} · plan: {r.subscription_plan} · commission: {r.commission_pct}%</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => setStatus(r.id, 'active')}>Approve</button>}
                {r.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => setStatus(r.id, 'rejected')}>Reject</button>}
                {r.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => setStatus(r.id, 'suspended')}>Suspend</button>}
                {r.status === 'suspended' && <button className="btn btn-success btn-sm" onClick={() => setStatus(r.id, 'active')}>Reactivate</button>}
                <button className="btn btn-sm" onClick={() => startEditBilling(r)}>Billing</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>

            {editing === r.id && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Plan</label>
                  <select value={billingForm.subscription_plan} onChange={(e) => setBillingForm({ ...billingForm, subscription_plan: e.target.value })}>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Commission %</label>
                  <input type="number" step="0.1" value={billingForm.commission_pct} onChange={(e) => setBillingForm({ ...billingForm, commission_pct: e.target.value })} />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Monthly fee (₹)</label>
                  <input type="number" step="1" value={billingForm.monthly_fee} onChange={(e) => setBillingForm({ ...billingForm, monthly_fee: e.target.value })} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => saveBilling(r.id)}>Save</button>
                <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
