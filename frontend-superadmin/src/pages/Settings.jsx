import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const KEYS = [
  { key: 'delivery_charge_rules', label: 'Delivery charge rules', placeholder: '{"base_fee": 40, "free_above": 499}' },
  { key: 'tax_rules', label: 'Tax / GST settings', placeholder: '{"gst_percent": 5}' },
  { key: 'homepage_banners', label: 'Homepage banners', placeholder: '[{"image_url": "https://...", "link": "/r/king-burger-express"}]' },
  { key: 'featured_restaurants', label: 'Featured restaurants (slugs)', placeholder: '["king-burger-express"]' },
];

export default function Settings() {
  const { token } = useAuth();
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.settings(token).then((data) => {
      const strs = {};
      for (const k of KEYS) strs[k.key] = data[k.key] ? JSON.stringify(data[k.key], null, 2) : '';
      setValues(strs);
    }).catch(() => {});
  }, [token]);

  const save = async (key) => {
    try {
      const parsed = values[key] ? JSON.parse(values[key]) : {};
      await api.saveSetting(key, parsed, token);
      setSaved(key);
      setTimeout(() => setSaved(''), 2000);
    } catch {
      alert('Invalid JSON — please check the format.');
    }
  };

  return (
    <div>
      <div className="page-head"><div><h1>Platform settings</h1><p>Global configuration applied across all restaurants and the customer site</p></div></div>
      {KEYS.map(({ key, label, placeholder }) => (
        <div className="card" key={key}>
          <h3 style={{ marginTop: 0 }}>{label}</h3>
          {saved === key && <div className="success-banner">Saved</div>}
          <textarea
            rows={4}
            style={{ width: '100%', background: 'var(--panel-alt)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: 10, fontFamily: 'var(--font-mono)', fontSize: 13 }}
            placeholder={placeholder}
            value={values[key] || ''}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
          />
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => save(key)}>Save {label.toLowerCase()}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
