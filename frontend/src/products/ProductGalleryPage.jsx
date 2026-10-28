export default function ProductGalleryPage({ products, onOpenProduct }) {
  const withImages = products.filter((product) => product.imageUrl);

  return (
    <section className="product-page">
      <div className="product-heading">
        <div>
          <span className="product-kicker">PRODUCT CATALOG / MEDIA</span>
          <h1>Product Images</h1>
          <p>Browse product images saved with your inventory records.</p>
        </div>
      </div>
      <section className="product-gallery-card">
        <header><div><h2>Product Gallery</h2><small>{withImages.length} images from your database</small></div></header>
        {withImages.length ? (
          <div className="product-gallery-grid">
            {withImages.map((product) => (
              <button className="product-gallery-item" type="button" key={product.id} onClick={() => onOpenProduct(product)}>
                <img src={product.imageUrl} alt={product.name} />
                <strong>{product.name}</strong>
                <small>{product.id}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="product-empty-state"><span>▧</span><strong>No saved product images</strong><p>Upload an image when creating a product to see it here.</p></div>
        )}
      </section>
    </section>
  );
}
