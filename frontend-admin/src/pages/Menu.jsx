import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Menu() {
  const { token, restaurantId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '', veg_flag: 'veg', image_url: '' });

  const load = () => {
    api.categories(restaurantId, token).then(setCategories).catch(() => {});
    api.items(restaurantId, token).then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, [restaurantId, token]);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    await api.addCategory(restaurantId, { name: newCat }, token);
    setNewCat('');
    load();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Items in it will become uncategorized.')) return;
    await api.deleteCategory(restaurantId, id, token);
    load();
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.addItem(restaurantId, { ...itemForm, price: parseFloat(itemForm.price) }, token);
      setItemForm({ name: '', description: '', price: '', category_id: '', veg_flag: 'veg', image_url: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleAvailable = async (item) => {
    await api.updateItem(restaurantId, item.id, { is_available: !item.is_available }, token);
    load();
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await api.deleteItem(restaurantId, id, token);
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Menu</h1><p>Manage categories and items customers see on your storefront</p></div></div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Categories</h3>
        <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ flex: 1, padding: '9px 11px', border: '1px solid #C9C4B6', borderRadius: 4 }} />
          <button className="btn btn-primary">Add</button>
        </form>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <span key={c.id} className="badge accepted" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
              {c.name}
              <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer' }}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add item</h3>
        <form onSubmit={addItem}>
          <div className="form-field"><label>Name</label><input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></div>
          <div className="form-field"><label>Description</label><textarea rows={2} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-field" style={{ flex: 1 }}><label>Price (₹)</label><input type="number" step="0.01" required value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} /></div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Category</label>
              <select value={itemForm.category_id} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Type</label>
              <select value={itemForm.veg_flag} onChange={(e) => setItemForm({ ...itemForm, veg_flag: e.target.value })}>
                <option value="veg">Veg</option>
                <option value="non_veg">Non-veg</option>
                <option value="egg">Egg</option>
              </select>
            </div>
          </div>
          <div className="form-field"><label>Image URL</label><input value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="https://..." /></div>
          <button className="btn btn-primary">Add item</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>All items</h3>
        {items.length === 0 ? <p className="empty-state">No items yet.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td>{categories.find((c) => c.id === it.category_id)?.name || '—'}</td>
                  <td>₹{it.price}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => toggleAvailable(it)}>
                      {it.is_available ? 'In stock' : 'Out of stock'}
                    </button>
                  </td>
                  <td><button className="btn btn-sm" onClick={() => deleteItem(it.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
