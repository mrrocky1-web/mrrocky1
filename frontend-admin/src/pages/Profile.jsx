import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { token, restaurantId } = useAuth();
  const [form, setForm] = useState({ name: '', city: '', address: '', gst_number: '', logo_url: '', banner_url: '' });
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    await api.updateProfile(restaurantId, body, token);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-head"><div><h1>Restaurant profile</h1><p>Update the details customers see on your storefront</p></div></div>
      {saved && <div className="success-banner">Profile updated</div>}
      <div className="card">
        <form onSubmit={submit}>
          <div className="form-field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-field"><label>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="form-field"><label>Address</label><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="form-field"><label>GST number</label><input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></div>
          <div className="form-field"><label>Logo URL</label><input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
          <div className="form-field"><label>Banner URL</label><input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
          <button className="btn btn-primary">Save changes</button>
        </form>
      </div>
    </div>
  );
}
