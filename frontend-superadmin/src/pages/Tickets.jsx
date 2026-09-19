import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function Tickets() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  const load = () => api.tickets(token).then(setTickets).catch(() => {});
  useEffect(() => { load(); }, [token]);

  const updateStatus = async (id, status) => {
    await api.updateTicket(id, status, token);
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Support tickets</h1><p>Complaints and disputes between customers and restaurants</p></div></div>
      <div className="card">
        {tickets.length === 0 ? <p className="empty-state">No support tickets. Nice and quiet.</p> : (
          <table>
            <thead><tr><th>Subject</th><th>Status</th><th>Opened</th><th>Update</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.subject}</td>
                  <td><span className={`badge ${t.status === 'resolved' || t.status === 'closed' ? 'active' : 'pending'}`}>{t.status}</span></td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
