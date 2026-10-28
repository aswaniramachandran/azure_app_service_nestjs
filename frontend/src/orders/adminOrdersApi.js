import { apiRequest } from '../apiClient.js';

export async function fetchAdminOrders({
  search = '',
  status = 'all',
  page = 1,
  limit = 10,
} = {}) {
  if (!localStorage.getItem('access_token')) {
    throw new Error('Please sign in as an administrator to view orders.');
  }

  const query = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) query.set('search', search.trim());

  const response = await apiRequest(`/admin/orders?${query.toString()}`);
  if (
    !response ||
    !Array.isArray(response.data) ||
    !response.meta ||
    !Number.isInteger(response.meta.page) ||
    !Number.isInteger(response.meta.limit) ||
    !Number.isInteger(response.meta.total) ||
    !Number.isInteger(response.meta.totalPages) ||
    typeof response.meta.hasNextPage !== 'boolean' ||
    typeof response.meta.hasPreviousPage !== 'boolean'
  ) {
    throw new Error('The admin orders API returned an invalid response.');
  }
  return response;
}

export async function updateAdminOrderStatus(orderId, status) {
  if (!localStorage.getItem('access_token')) {
    throw new Error('Please sign in as an administrator to update orders.');
  }

  const id = Number(orderId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('This order does not have a valid ID.');
  }

  return apiRequest(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
