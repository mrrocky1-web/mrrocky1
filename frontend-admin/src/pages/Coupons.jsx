import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Coupons() {
  const { token, restaurantId } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percent', discount_value: '', min_order_value: '' });
  const [error, setError] = useState('');

  const load = () => api.coupons(restaurantId, token).then(setCoupons).catch(() => {});
  useEffect(() => { load(); }, [restaurantId, token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.addCoupon(restaurantId, {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
      }, token);
      setForm({ code: '', description: '', discount_type: 'percent', discount_value: '', min_order_value: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggle = async (c) => {
    await api.toggleCoupon(restaurantId, c.id, !c.is_active, token);
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Coupons</h1><p>Create discounts specific to your restaurant</p></div></div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>New coupon</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-field" style={{ flex: 1 }}><label>Code</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percent">Percent off</option>
                <option value="flat">Flat amount off</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}><label>Value</label><input type="number" required value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
          </div>
          <div className="form-field"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-field"><label>Minimum order value (₹)</label><input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} /></div>
          <button className="btn btn-primary">Create coupon</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Active & past coupons</h3>
        {coupons.length === 0 ? <p className="empty-state">No coupons yet.</p> : (
          <table>
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Status</th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="order-number">{c.code}</td>
                  <td>{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                  <td>₹{c.min_order_value}</td>
                  <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td><button className="btn btn-sm" onClick={() => toggle(c)}>{c.is_active ? 'Active — pause' : 'Paused — activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
