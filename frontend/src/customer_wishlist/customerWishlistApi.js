import { apiRequest } from '../apiClient.js';

function requireCustomerSession() {
  if (
    !localStorage.getItem('access_token') &&
    !localStorage.getItem('refresh_token')
  ) {
    throw new Error('Please sign in to use your wishlist.');
  }
}

function validateWishlist(wishlist) {
  if (!wishlist || !Array.isArray(wishlist.items)) {
    throw new Error('The wishlist API returned an invalid response.');
  }
  return wishlist;
}

function validateId(id, label) {
  const normalizedId = Number(id);
  if (!Number.isInteger(normalizedId) || normalizedId < 1) {
    throw new Error(`This ${label} does not have a valid ID.`);
  }
  return normalizedId;
}

export async function fetchCustomerWishlist() {
  requireCustomerSession();
  return validateWishlist(await apiRequest('/wishlist'));
}

export async function addCustomerWishlistItem(productId) {
  requireCustomerSession();
  const normalizedProductId = validateId(productId, 'product');
  return validateWishlist(await apiRequest(`/wishlist/items/${normalizedProductId}`, {
    method: 'POST',
  }));
}

export async function removeCustomerWishlistItem(itemId) {
  requireCustomerSession();
  const normalizedItemId = validateId(itemId, 'wishlist item');
  return validateWishlist(await apiRequest(`/wishlist/items/${normalizedItemId}`, {
    method: 'DELETE',
  }));
}

export async function clearCustomerWishlist() {
  requireCustomerSession();
  await apiRequest('/wishlist', { method: 'DELETE' });
  return fetchCustomerWishlist();
}

export function notifyCustomerWishlistUpdated(wishlist) {
  const items = Array.isArray(wishlist?.items) ? wishlist.items : [];
  window.dispatchEvent(new CustomEvent('customer-wishlist-updated', {
    detail: {
      totalItems: Number(wishlist?.totalItems) || items.length,
      wishlist: { ...wishlist, items },
    },
  }));
}
