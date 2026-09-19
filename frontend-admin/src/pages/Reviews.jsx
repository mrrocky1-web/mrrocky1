import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Reviews() {
  const { token, restaurantId } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [drafts, setDrafts] = useState({});

  const load = () => api.reviews(restaurantId).then(setReviews).catch(() => {});
  useEffect(() => { load(); }, [restaurantId]);

  const sendReply = async (id) => {
    if (!drafts[id]?.trim()) return;
    await api.replyToReview(id, drafts[id], token);
    setDrafts({ ...drafts, [id]: '' });
    load();
  };

  return (
    <div>
      <div className="page-head"><div><h1>Reviews</h1><p>See what customers are saying and respond</p></div></div>
      {reviews.length === 0 ? (
        <div className="card"><p className="empty-state">No reviews yet.</p></div>
      ) : (
        reviews.map((r) => (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p style={{ margin: '10px 0' }}>{r.comment}</p>}
            {r.reply ? (
              <div style={{ background: 'var(--canvas)', padding: 12, borderRadius: 4, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Your reply</div>
                {r.reply}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  placeholder="Write a reply…"
                  value={drafts[r.id] || ''}
                  onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #C9C4B6', borderRadius: 4 }}
                />
                <button className="btn btn-sm" onClick={() => sendReply(r.id)}>Reply</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
