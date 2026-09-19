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
  listRestaurants: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/restaurants${qs ? `?${qs}` : ''}`);
  },
  getRestaurant: (slug) => request(`/restaurants/${slug}`),
  signup: (body) => request('/auth/customer/signup', { method: 'POST', body }),
  login: (body) => request('/auth/customer/login', { method: 'POST', body }),
  placeOrder: (body, token) => request('/orders', { method: 'POST', body, token }),
  myOrders: (token) => request('/orders/my', { token }),
  getOrder: (id, token) => request(`/orders/${id}`, { token }),
  getReviews: (restaurantId) => request(`/reviews/restaurant/${restaurantId}`),
  postReview: (body, token) => request('/reviews', { method: 'POST', body, token }),
};
