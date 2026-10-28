import { useEffect, useState } from 'react';

const LOW_STOCK_THRESHOLD = 5;
const PRODUCTS_PER_PAGE = 10;

const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-start', ...Array.from({ length: 5 }, (_, index) => totalPages - 4 + index)];
  }
  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages];
}

export default function ProductListPage({
  products,
  catalogMeta,
  loading,
  error,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onRefresh,
  onSearchProducts,
}) {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(null);

  useEffect(() => {
    const query = search.trim();
    if (!query && stockFilter === 'all' && currentPage === 1 && !sortOrder) {
      setSearchResults(null);
      setSearching(false);
      setSearchError('');
      return undefined;
    }

    let isCurrentSearch = true;
    setSearchResults(null);
    setSearching(true);
    setSearchError('');

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await onSearchProducts(query, stockFilter, currentPage, sortOrder);
        if (isCurrentSearch) {
          setSearchResults({
            data: Array.isArray(response?.data) ? response.data : [],
            meta: response?.meta || {},
          });
        }
      } catch (error) {
        if (isCurrentSearch) {
          setSearchResults({ data: [], meta: {} });
          setSearchError(
            error.message || 'Unable to load products. Please try again.',
          );
        }
      } finally {
        if (isCurrentSearch) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      isCurrentSearch = false;
      window.clearTimeout(timeoutId);
    };
  }, [search, stockFilter, currentPage, sortOrder, onSearchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stockFilter, sortOrder]);

  const handleRefresh = () => {
    setSearch('');
    setStockFilter('all');
    setCurrentPage(1);
    setSortOrder(null);
    setSearchResults(null);
    setSearching(false);
    setSearchError('');
    onRefresh();
  };

  const isFiltered = Boolean(search.trim()) || stockFilter !== 'all';
  const isDefaultPage = !isFiltered && !sortOrder && currentPage === 1;
  const activeResponse = isDefaultPage
    ? { data: products, meta: catalogMeta }
    : searchResults;
  const pageProducts = Array.isArray(activeResponse?.data) ? activeResponse.data : [];
  const pagination = activeResponse?.meta || {};
  const totalProducts = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || 0;
  const displayedPage = Number(pagination.page) || currentPage;
  const pageLimit = Number(pagination.limit) || PRODUCTS_PER_PAGE;
  const pageItems = getPageItems(currentPage, totalPages);
  const pageStart = (displayedPage - 1) * pageLimit;
  const isEmptyCatalog = !isFiltered && totalProducts === 0;
  const lowStockCount = pageProducts.filter(
    (product) => Number(product.quantity) <= LOW_STOCK_THRESHOLD,
  ).length;

  useEffect(() => {
    if (searchResults?.meta?.totalPages !== undefined) {
      setCurrentPage((page) => Math.min(page, Math.max(Number(searchResults.meta.totalPages), 1)));
    }
  }, [searchResults]);

  const units = pageProducts.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0,
  );
  const inventoryValue = pageProducts.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.quantity || 0),
    0,
  );

  return (
    <section className="product-page">
      <div className="product-heading">
        <div>
          <span className="product-kicker">PRODUCT CATALOG</span>
          <h1>Product List</h1>
          <p>Manage your store products, stock and pricing.</p>
        </div>
        <button className="product-primary-button" type="button" onClick={onAdd}>
          <span>＋</span> Add Product
        </button>
      </div>

      <div className="product-stats">
        <article><span className="product-stat-icon violet">▣</span><div><small>Total Products</small><strong>{Number(catalogMeta?.total) || products.length}</strong><em>in catalog</em></div></article>
        <article><span className="product-stat-icon blue">▥</span><div><small>Stock on Page</small><strong>{units.toLocaleString()}</strong><em>units on current page</em></div></article>
        <article><span className="product-stat-icon orange">⚠</span><div><small>Low Stock on Page</small><strong>{lowStockCount}</strong><em>needs attention</em></div></article>
        <article><span className="product-stat-icon red">＄</span><div><small>Page Inventory Value</small><strong>{currency(inventoryValue)}</strong><em>price × quantity</em></div></article>
      </div>

      <section className="product-table-card">
        <header className="product-table-toolbar">
          <div><h2>All Products</h2><small>{searching ? 'Loading products…' : loading ? 'Loading products…' : `${totalProducts} products`}</small></div>
          <div className="product-list-tools">
            <label className="product-search"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /></label>
            <button
              className={`product-sort-button product-sort-toolbar-button${sortOrder ? ' active' : ''}`}
              type="button"
              onClick={() => {
                setSortOrder((order) => order === 'asc' ? 'desc' : 'asc');
                setCurrentPage(1);
              }}
              aria-label={`Sort by name ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              title={`Sort by name ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >{sortOrder === 'desc' ? '↓' : '↑'}</button>
            <select aria-label="Filter by stock status" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <button className="product-icon-button" type="button" onClick={handleRefresh} disabled={loading} aria-label="Refresh products">↻</button>
          </div>
        </header>

        {error && <p className="product-api-error" role="alert">{error}</p>}
        {searchError && <p className="product-api-error" role="alert">{searchError}</p>}
        {(loading || searching) && !pageProducts.length ? (
          <div className="product-empty-state">Loading your database products…</div>
        ) : pageProducts.length ? (
          <>
          <div className="product-table-wrap">
            <table className="product-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pageProducts.map((product) => {
                  const quantity = Number(product.quantity);
                  const state = quantity === 0 ? 'out' : quantity <= LOW_STOCK_THRESHOLD ? 'low' : 'in';
                  const label = state === 'out' ? 'Out of Stock' : state === 'low' ? 'Low Stock' : 'In Stock';
                  return (
                    <tr key={product.id}>
                      <td>
                        <button className="product-row-main" type="button" onClick={() => onView(product)}>
                          <span className="product-row-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : '📦'}</span>
                          <span><strong>{product.name}</strong><small>Product ID: {product.id}</small></span>
                        </button>
                      </td>
                      <td>{currency(product.price)}</td>
                      <td>{quantity.toLocaleString()} units</td>
                      <td><span className={`product-stock-badge ${state}`}>{label}</span></td>
                      <td><div className="product-row-actions">
                        <button type="button" title={`View ${product.name}`} onClick={() => onView(product)}>◉</button>
                        <button type="button" title={`Edit ${product.name}`} onClick={() => onEdit(product)}>✎</button>
                        <button className="delete" type="button" title={`Delete ${product.name}`} aria-label={`Delete ${product.name}`} onClick={() => onDelete(product)}>
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M4.5 6h11l-.8 10.2a1.2 1.2 0 0 1-1.2 1.1h-7a1.2 1.2 0 0 1-1.2-1.1L4.5 6Z" />
                            <path d="M3 4.5h14M7.2 4.5V3.4c0-.5.4-.9.9-.9h3.8c.5 0 .9.4.9.9v1.1M8 8.5v5.8M12 8.5v5.8" />
                          </svg>
                        </button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav className="product-pagination" aria-label="Product list pages">
              <span className="product-pagination-range">
                Showing {pageStart + 1}–{Math.min(pageStart + pageProducts.length, totalProducts)} of {totalProducts}
              </span>
              <div className="product-pagination-controls">
                <button
                  className="product-page-step"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={pagination.hasPreviousPage === false || currentPage === 1}
                  aria-label="Previous page"
                >Previous</button>
                {pageItems.map((item, index) => typeof item === 'number' ? (
                  <button
                    className={`product-page-number${currentPage === item ? ' active' : ''}`}
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >{item}</button>
                ) : (
                  <span className="product-page-ellipsis" key={`${item}-${index}`} aria-hidden="true">…</span>
                ))}
                <button
                  className="product-page-step"
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={pagination.hasNextPage === false || currentPage === totalPages}
                  aria-label="Next page"
                >Next</button>
              </div>
            </nav>
          )}
          </>
        ) : (
          <div className="product-empty-state">
            <span>▣</span>
            <strong>{isEmptyCatalog ? 'No products in your database yet' : 'No matching products'}</strong>
            <p>{isEmptyCatalog ? 'Add a product to get started.' : 'Try another search or stock filter.'}</p>
            {isEmptyCatalog && <button className="product-secondary-button" type="button" onClick={onAdd}>Add Product</button>}
          </div>
        )}
      </section>
      <p className="product-data-footnote">Product information is loaded from your Products API.</p>
    </section>
  );
}
