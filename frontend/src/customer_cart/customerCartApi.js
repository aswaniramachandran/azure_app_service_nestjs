import { apiRequest } from '../apiClient.js';

async function cartRequest(path, options = {}) {
  if (
    !localStorage.getItem('access_token') &&
    !localStorage.getItem('refresh_token')
  ) {
    throw new Error('Please sign in to use your cart.');
  }
  return apiRequest(path, options);
}

export function fetchCustomerCart() {
  return cartRequest('/cart');
}

export function addCustomerCartItem(productId, quantity = 1) {
  const normalizedProductId = Number(productId);
  if (!Number.isInteger(normalizedProductId) || normalizedProductId < 1) {
    return Promise.reject(new Error('This product does not have a valid product ID.'));
  }
  return cartRequest('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId: normalizedProductId, quantity }),
  });
}

export function updateCustomerCartItem(itemId, quantity) {
  return cartRequest(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCustomerCartItem(itemId) {
  return cartRequest(`/cart/items/${itemId}`, { method: 'DELETE' });
}

export function clearCustomerCart() {
  return cartRequest('/cart', { method: 'DELETE' });
}

export function notifyCustomerCartUpdated(cart) {
  window.dispatchEvent(new CustomEvent('customer-cart-updated', {
    detail: {
      totalItems: Number(cart?.totalItems) || 0,
      cart,
    },
  }));
}

export function cartItemCount(items = []) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}
