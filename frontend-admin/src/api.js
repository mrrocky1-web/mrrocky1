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
  login: (body) => request('/auth/restaurant/login', { method: 'POST', body }),
  signup: (body) => request('/auth/restaurant/signup', { method: 'POST', body }),

  // Orders
  orders: (restaurantId, token, status) =>
    request(`/orders/restaurant/${restaurantId}${status ? `?status=${status}` : ''}`, { token }),
  getOrder: (orderId, token) => request(`/orders/${orderId}`, { token }),
  updateOrderStatus: (orderId, status, token) =>
    request(`/orders/${orderId}/status`, { method: 'PATCH', body: { status }, token }),

  // Menu
  categories: (restaurantId, token) => request(`/restaurants/${restaurantId}/menu/categories`, { token }),
  addCategory: (restaurantId, body, token) => request(`/restaurants/${restaurantId}/menu/categories`, { method: 'POST', body, token }),
  deleteCategory: (restaurantId, categoryId, token) => request(`/restaurants/${restaurantId}/menu/categories/${categoryId}`, { method: 'DELETE', token }),

  items: (restaurantId, token) => request(`/restaurants/${restaurantId}/menu/items`, { token }),
  addItem: (restaurantId, body, token) => request(`/restaurants/${restaurantId}/menu/items`, { method: 'POST', body, token }),
  updateItem: (restaurantId, itemId, body, token) => request(`/restaurants/${restaurantId}/menu/items/${itemId}`, { method: 'PATCH', body, token }),
  deleteItem: (restaurantId, itemId, token) => request(`/restaurants/${restaurantId}/menu/items/${itemId}`, { method: 'DELETE', token }),

  // Coupons
  coupons: (restaurantId, token) => request(`/restaurants/${restaurantId}/coupons`, { token }),
  addCoupon: (restaurantId, body, token) => request(`/restaurants/${restaurantId}/coupons`, { method: 'POST', body, token }),
  toggleCoupon: (restaurantId, couponId, is_active, token) =>
    request(`/restaurants/${restaurantId}/coupons/${couponId}`, { method: 'PATCH', body: { is_active }, token }),

  // Reviews
  reviews: (restaurantId) => request(`/reviews/restaurant/${restaurantId}`),
  replyToReview: (reviewId, reply, token) => request(`/reviews/${reviewId}/reply`, { method: 'PATCH', body: { reply }, token }),

  // Profile
  updateProfile: (restaurantId, body, token) => request(`/restaurants/${restaurantId}/profile`, { method: 'PATCH', body, token }),
};
