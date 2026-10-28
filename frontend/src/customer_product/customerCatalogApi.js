import { API_BASE as CUSTOMER_API_BASE } from '../apiClient.js';

export { CUSTOMER_API_BASE };

async function fetchPage(path, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
  const queryString = params.toString();
  const response = await fetch(`${CUSTOMER_API_BASE}${path}${queryString ? `?${queryString}` : ''}`);
  if (!response.ok) {
    throw new Error((await response.text()) || `Catalog request failed (${response.status})`);
  }
  return response.json();
}

async function fetchAllPages(path, initialQuery = {}) {
  const first = await fetchPage(path, initialQuery);
  if (Array.isArray(first)) return first;
  if (!Array.isArray(first?.data)) {
    throw new Error(`The ${path} API returned an invalid response.`);
  }
  const firstData = first.data;
  const totalPages = Number(first?.meta?.totalPages) || 1;
  if (totalPages <= 1) return firstData;
  const limit = Number(first?.meta?.limit) || 10;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(path, {
      ...initialQuery,
      page: index + 2,
      limit,
    })),
  );
  return firstData.concat(...remaining.map((response) => {
    if (Array.isArray(response)) return response;
    if (!Array.isArray(response?.data)) {
      throw new Error(`The ${path} API returned an invalid response.`);
    }
    return response.data;
  }));
}

const normalizeProducts = (products) => products.map((product) => ({
  ...product,
  price: Number(product.price) || 0,
  quantity: Number(product.quantity) || 0,
  stockQuantity: Number(product.quantity) || 0,
}));

export async function fetchCustomerCategories() {
  return fetchAllPages('/categories');
}

export async function fetchCustomerProducts(categoryId = '', brandId = '', minPrice = '', maxPrice = '', search = '') {
  const query = {};
  if (categoryId) query.categoryId = categoryId;
  if (brandId) query.brandId = brandId;
  if (minPrice !== '') query.minPrice = minPrice;
  if (maxPrice !== '') query.maxPrice = maxPrice;
  if (search.trim()) query.search = search.trim();
  const products = await fetchAllPages('/products', query);
  return normalizeProducts(products);
}

export async function fetchCustomerBrands() {
  const response = await fetchPage('/brands');
  const records = Array.isArray(response) ? response : response?.data;
  if (!Array.isArray(records)) {
    throw new Error('The brands API returned an invalid response.');
  }
  return records;
}

export async function fetchCustomerCatalog() {
  const [products, categories] = await Promise.all([
    fetchCustomerProducts(),
    fetchCustomerCategories(),
  ]);
  const categoryNames = new Map(categories.map((category) => [Number(category.id), category.name]));

  return products.map((product) => ({
    ...product,
    categoryName: product.category?.name || categoryNames.get(Number(product.categoryId)) || '',
  }));
}