import { apiRequest } from '../apiClient.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateVisualSearchImage(file) {
  if (!file) return 'Choose an image to search.';
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG, or WEBP image.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'The image must be 5 MB or smaller.';
  }
  return '';
}

export async function searchProductsByImage(file) {
  const validationError = validateVisualSearchImage(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append('image', file);

  const response = await apiRequest('/visual-search/search', {
    method: 'POST',
    body: formData,
  });

  if (!Array.isArray(response?.products)) {
    throw new Error('The visual search service returned an invalid response.');
  }

  return {
    count: Number(response.count) || response.products.length,
    products: response.products,
  };
}
