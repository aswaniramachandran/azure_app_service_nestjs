const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

export default function ProductDetailPage({ product, onBack, onEdit }) {
  if (!product) {
    return <section className="product-page"><div className="product-empty-state">Product not found. Return to the product list and select an item.</div><button className="product-secondary-button" type="button" onClick={onBack}>Back to Products</button></section>;
  }

  const quantity = Number(product.quantity);
  const status = quantity === 0 ? 'Out of Stock' : quantity <= 5 ? 'Low Stock' : 'In Stock';

  return (
    <section className="product-page">
      <div className="product-heading">
        <div><span className="product-kicker">PRODUCT CATALOG / DETAILS</span><h1>{product.name}</h1><p>Product ID: {product.id}</p></div>
        <div className="product-detail-actions">
          <button className="product-secondary-button" type="button" onClick={onBack}>← Back to Products</button>
          <button className="product-primary-button" type="button" onClick={() => onEdit(product)}>Edit Product</button>
        </div>
      </div>
      <div className="product-detail-grid">
        <section className="product-detail-image-card">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="product-detail-no-image">📦<small>No product image</small></div>}
        </section>
        <section className="product-detail-info">
          <span className={`product-stock-badge ${quantity === 0 ? 'out' : quantity <= 5 ? 'low' : 'in'}`}>{status}</span>
          <h2>{product.name}</h2>
          <strong className="product-detail-price">{currency(product.price)}</strong>
          <div className="product-detail-divider" />
          <dl>
            <div><dt>Product ID</dt><dd>{product.id}</dd></div>
            <div><dt>Available stock</dt><dd>{quantity.toLocaleString()} units</dd></div>
            <div><dt>Unit price</dt><dd>{currency(product.price)}</dd></div>
            <div><dt>Inventory value</dt><dd>{currency(Number(product.price) * quantity)}</dd></div>
          </dl>
          <p className="product-supported-fields">Details shown are loaded from the product record in your database.</p>
          <button className="product-primary-button" type="button" onClick={() => onEdit(product)}>Edit Product</button>
        </section>
      </div>
    </section>
  );
}
