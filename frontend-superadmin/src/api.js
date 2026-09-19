const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (body) => request('/auth/superadmin/login', { method: 'POST', body }),

  restaurants: (token, status) => request(`/superadmin/restaurants${status ? `?status=${status}` : ''}`, { token }),
  setRestaurantStatus: (id, status, token) => request(`/superadmin/restaurants/${id}/status`, { method: 'PATCH', body: { status }, token }),
  setBilling: (id, body, token) => request(`/superadmin/restaurants/${id}/billing`, { method: 'PATCH', body, token }),
  deleteRestaurant: (id, token) => request(`/superadmin/restaurants/${id}`, { method: 'DELETE', token }),

  analytics: (token) => request('/superadmin/analytics/overview', { token }),

  settings: (token) => request('/superadmin/settings', { token }),
  saveSetting: (key, value, token) => request(`/superadmin/settings/${key}`, { method: 'PUT', body: { value }, token }),

  customers: (token) => request('/superadmin/customers', { token }),
  blockCustomer: (id, is_blocked, token) => request(`/superadmin/customers/${id}/block`, { method: 'PATCH', body: { is_blocked }, token }),

  restaurantAdmins: (token) => request('/superadmin/restaurant-admins', { token }),

  tickets: (token) => request('/superadmin/tickets', { token }),
  updateTicket: (id, status, token) => request(`/superadmin/tickets/${id}`, { method: 'PATCH', body: { status }, token }),

  auditLogs: (token) => request('/superadmin/audit-logs', { token }),
};
