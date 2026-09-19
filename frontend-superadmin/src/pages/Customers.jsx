import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);

  const load = () => api.customers(token).then(setCustomers).catch(() => {});
  useEffect(() => { load(); }, [token]);

  const toggleBlock = async (c) => {
    await api.blockCustomer(c.id, !c.is_blocked, token);
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Customers</h1><p>Platform-wide customer accounts</p></div></div>
      <div className="card">
        {customers.length === 0 ? <p className="empty-state">No customers yet.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Loyalty pts</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name || '—'}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.loyalty_points}</td>
                  <td><span className={`badge ${c.is_blocked ? 'suspended' : 'active'}`}>{c.is_blocked ? 'blocked' : 'active'}</span></td>
                  <td><button className={`btn btn-sm ${c.is_blocked ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleBlock(c)}>{c.is_blocked ? 'Unblock' : 'Block'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
