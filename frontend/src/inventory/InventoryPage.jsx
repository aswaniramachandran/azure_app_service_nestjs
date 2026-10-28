import { useMemo, useState } from 'react';

const LOW_STOCK_LIMIT = 5;

const sections = [
  ['Stock', '▣'],
  ['Low Stock', '⚠'],
  ['Stock History', '◷'],
];

function StockStats({ products, loading, catalogMeta }) {
  const count = Number(catalogMeta?.total ?? products.length);
  const inStock = products.filter((product) => Number(product.quantity) > LOW_STOCK_LIMIT).length;
  const low = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= LOW_STOCK_LIMIT).length;
  const out = products.filter((product) => Number(product.quantity) === 0).length;

  return (
    <div className="inventory-stats">
      <article><span className="inventory-stat-icon purple">▣</span><div><small>Total Products</small><strong>{loading && !count ? '—' : count}</strong><em>in catalog</em></div></article>
      <article><span className="inventory-stat-icon green">▤</span><div><small>In Stock on Page</small><strong>{inStock}</strong><em>loaded products above threshold</em></div></article>
      <article><span className="inventory-stat-icon orange">⚠</span><div><small>Low Stock on Page</small><strong>{low}</strong><em>loaded products, quantity 1–{LOW_STOCK_LIMIT}</em></div></article>
      <article><span className="inventory-stat-icon red">▣</span><div><small>Out of Stock on Page</small><strong>{out}</strong><em>loaded products with zero stock</em></div></article>
    </div>
  );
}

function StockTable({ products, loading, error, lowOnly, onRefresh, onEdit }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');

  const rows = useMemo(() => products.filter((product) => {
    const quantity = Number(product.quantity);
    const state = quantity === 0 ? 'Out of Stock' : quantity <= LOW_STOCK_LIMIT ? 'Low Stock' : 'In Stock';
    return (!lowOnly || quantity <= LOW_STOCK_LIMIT) &&
      (`${product.name} ${product.id}`.toLowerCase().includes(query.toLowerCase())) &&
      (status === 'All Status' || status === state);
  }), [products, query, status, lowOnly]);

  return (
    <>
      {error && <div className="inventory-api-error" role="alert">{error}</div>}
      <section className="inventory-table-card">
        <header className="inventory-toolbar">
          <label className="inventory-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products by name or ID..." /></label>
          <select aria-label="Filter stock status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All Status</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option></select>
          <button type="button" className="inventory-refresh" aria-label="Refresh inventory" disabled={loading} onClick={onRefresh}>↻</button>
          <button type="button" className="inventory-export" onClick={() => window.print()}>⇩ &nbsp;Export</button>
        </header>
        {loading && products.length === 0 ? <div className="inventory-empty">Loading products from database…</div> : rows.length ? (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead><tr><th>#</th><th>IMAGE</th><th>PRODUCT NAME</th><th>PRODUCT ID</th><th>CURRENT STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>{rows.map((product, index) => {
                const quantity = Number(product.quantity);
                const state = quantity === 0 ? 'out' : quantity <= LOW_STOCK_LIMIT ? 'low' : 'in';
                const label = state === 'out' ? 'Out of Stock' : state === 'low' ? 'Low Stock' : 'In Stock';
                return (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td><span className="inventory-thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : '📦'}</span></td>
                    <td><strong>{product.name}</strong></td>
                    <td className="inventory-muted">{product.id}</td>
                    <td><strong>{quantity.toLocaleString()}</strong></td>
                    <td><span className={`inventory-status ${state}`}>{label}</span></td>
                    <td><div className="inventory-actions"><button type="button" aria-label={`View ${product.name}`} title="View">◉</button><button type="button" aria-label={`Edit ${product.name}`} title="Edit" onClick={() => onEdit(product)}>✎</button></div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <div className="inventory-empty"><strong>{products.length ? 'No matching stock records' : 'No products in inventory'}</strong><span>{products.length ? 'Change your search or status filter.' : 'Add products to populate inventory.'}</span></div>}
        <footer className="inventory-table-footer"><span>{rows.length} matching products on this API page</span></footer>
      </section>
      <p className="inventory-note">Product names, IDs, images and stock quantities come from your Products API. Low stock is defined as {LOW_STOCK_LIMIT} units or fewer.</p>
    </>
  );
}

function StockHistory() {
  return (
    <section className="inventory-table-card">
      <div className="inventory-empty">
        <strong>No stock history available</strong>
        <span>The backend does not currently provide stock movement records.</span>
      </div>
    </section>
  );
}

export default function InventoryPage({ page, products, catalogMeta, loading, error, onRefresh, onEdit }) {
  const currentPage = sections.some(([name]) => name === page) ? page : 'Stock';
  const lowCount = products.filter((product) => Number(product.quantity) <= LOW_STOCK_LIMIT).length;

  return (
    <section className="inventory-page">
      <div className="inventory-heading">
        <div><div className="inventory-breadcrumb">Workspace <b>/</b> Inventory <b>/</b> <strong>{currentPage}</strong></div><h1>{currentPage}</h1><p>{currentPage === 'Stock History' ? 'Review stock movement records when they are available from the backend.' : currentPage === 'Low Stock' ? 'Products that need restocking soon.' : 'Manage your product inventory and stock levels.'}</p></div>
        {currentPage !== 'Stock History' && <button className="inventory-add-button" type="button" onClick={() => onEdit(null)}>＋ Add Product</button>}
      </div>
      {currentPage !== 'Stock History' && <StockStats products={products} catalogMeta={catalogMeta} loading={loading} />}
      {currentPage === 'Stock History'
        ? <StockHistory />
        : <StockTable products={products} loading={loading} error={error} lowOnly={currentPage === 'Low Stock'} onRefresh={onRefresh} onEdit={onEdit} />}
    </section>
  );
}
