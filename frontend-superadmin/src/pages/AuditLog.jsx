import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuditLog() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => { api.auditLogs(token).then(setLogs).catch(() => {}); }, [token]);

  return (
    <div>
      <div className="page-head"><div><h1>Audit log</h1><p>Every super admin action, most recent first</p></div></div>
      <div className="card">
        {logs.length === 0 ? <p className="empty-state">No actions logged yet.</p> : (
          <table>
            <thead><tr><th>Action</th><th>Target</th><th>When</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.action}</td>
                  <td>{l.target_type} {l.target_id ? `· ${l.target_id.slice(0, 8)}…` : ''}</td>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
