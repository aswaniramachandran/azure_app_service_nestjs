import { apiRequest } from '../apiClient.js';

export async function fetchCustomerRecommendations(limit = 8) {
  const normalizedLimit = Math.min(8, Math.max(1, Math.floor(Number(limit) || 8)));
  const response = await apiRequest(
    `/recommendations/for-me?limit=${normalizedLimit}`,
  );

  if (!Array.isArray(response?.recommendations)) {
    throw new Error('The recommendations API returned an invalid response.');
  }

  return response.recommendations.slice(0, normalizedLimit);
}

export async function fetchProductRecommendations(productId, limit = 8, signal) {
  const normalizedProductId = Number(productId);
  if (!Number.isSafeInteger(normalizedProductId) || normalizedProductId < 1) {
    throw new Error('This product does not have a valid product ID.');
  }
  const normalizedLimit = Math.min(8, Math.max(1, Math.floor(Number(limit) || 8)));
  const response = await apiRequest(
    `/recommendations/products/${normalizedProductId}?limit=${normalizedLimit}`,
    { signal },
  );

  if (!Array.isArray(response?.recommendations)) {
    throw new Error('The product recommendations API returned an invalid response.');
  }

  return response.recommendations.slice(0, normalizedLimit);
}
