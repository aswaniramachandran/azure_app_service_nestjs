import { apiRequest } from '../apiClient.js';

function requireCustomerSession() {
  if (
    !localStorage.getItem('access_token') &&
    !localStorage.getItem('refresh_token')
  ) {
    throw new Error('Please sign in to view or place orders.');
  }
}

export async function fetchCustomerOrders({
  status,
  search,
  page = 1,
  limit = 10,
} = {}) {
  requireCustomerSession();
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== 'all') query.set('status', status);
  if (search) query.set('search', search);

  const response = await apiRequest(`/orders?${query.toString()}`);
  if (
    !response ||
    !Array.isArray(response.data) ||
    !response.meta ||
    !Number.isInteger(response.meta.page) ||
    !Number.isInteger(response.meta.limit) ||
    !Number.isInteger(response.meta.total) ||
    !Number.isInteger(response.meta.totalPages)
  ) {
    throw new Error('The orders API returned an invalid response.');
  }
  return response;
}

export async function fetchCustomerOrder(orderId) {
  requireCustomerSession();
  const id = Number(orderId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('This order does not have a valid ID.');
  }
  return apiRequest(`/orders/${id}`);
}

export async function fetchCustomerOrderTracking(orderId) {
  requireCustomerSession();
  const id = Number(orderId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('This order does not have a valid ID.');
  }
  return apiRequest(`/orders/${id}/tracking`);
}

export async function updateCustomerOrderTrackingLocation(orderId, location) {
  requireCustomerSession();
  const id = Number(orderId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('This order does not have a valid ID.');
  }
  return apiRequest(`/orders/${id}/tracking/location`, {
    method: 'PATCH',
    body: JSON.stringify(location),
  });
}

export async function createCustomerOrder(payload) {
  requireCustomerSession();
  const order = await apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!order || typeof order !== 'object' || !Array.isArray(order.items)) {
    throw new Error('The order API returned an invalid order response.');
  }
  return order;
}

export async function completeCustomerDemoPayment(paymentId) {
  requireCustomerSession();
  const id = Number(paymentId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('The order response did not include a valid payment ID.');
  }
  const result = await apiRequest(`/payments/${id}/demo/success`, {
    method: 'POST',
  });
  if (
    result?.paymentStatus !== 'paid' ||
    result?.orderStatus !== 'placed'
  ) {
    throw new Error('The demo payment did not confirm a paid, placed order.');
  }
  return result;
}

export async function cancelCustomerOrder(orderId) {
  requireCustomerSession();
  const id = Number(orderId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('This order does not have a valid ID.');
  }
  return apiRequest(`/orders/${id}/cancel`, { method: 'PATCH' });
}
