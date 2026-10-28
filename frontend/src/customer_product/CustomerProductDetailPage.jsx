import { useEffect, useState } from 'react';
import { fetchCustomerCatalog } from './customerCatalogApi.js';
import { fetchProductRecommendations } from './customerRecommendationApi.js';
import { useCustomerWishlist } from '../customer_wishlist/useCustomerWishlist.js';
import { addCustomerCartItem, notifyCustomerCartUpdated } from '../customer_cart/customerCartApi.js';
import './customer-product-detail.css';

function RelatedProductImage({ product, onView }) {
  const [imageFailed, setImageFailed] = useState(false);

  return <button
    className="cd-related-image"
    type="button"
    aria-label={`View ${product.name} details`}
    onClick={onView}
  >
    {product.imageUrl && !imageFailed
      ? <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
      : <span aria-hidden="true">▧</span>}
  </button>;
}

export default function CustomerProductDetailPage({ onNavigate }) {
  const search = new URLSearchParams(window.location.search);
  const productId = search.get('id');
  const productName = search.get('product');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [productRecommendations, setProductRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [recommendationsRetry, setRecommendationsRetry] = useState(0);
  const {
    items: wishlistItems,
    loading: wishlistLoading,
    error: wishlistError,
    isProductBusy,
    toggleProduct,
  } = useCustomerWishlist();
  const [activeTab, setActiveTab] = useState('Description');
  const product = products.find((item) => (productId && String(item.id) === productId) || (!productId && item.name === productName));
  const favorite = product
    ? wishlistItems.some((item) => Number(item.productId) === Number(product.id))
    : false;

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCatalog()
      .then((records) => { if (isCurrent) setProducts(records); })
      .catch((requestError) => { if (isCurrent) setError(requestError.message || 'Unable to load this product.'); })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (!product?.id) return undefined;

    if (!localStorage.getItem('access_token') && !localStorage.getItem('refresh_token')) {
      setProductRecommendations([]);
      setRecommendationsError('');
      setRecommendationsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setRecommendationsLoading(true);
    setRecommendationsError('');
    fetchProductRecommendations(product.id, 8, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setProductRecommendations(items);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setProductRecommendations([]);
          setRecommendationsError(requestError.message || 'Unable to load similar products.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRecommendationsLoading(false);
      });

    return () => controller.abort();
  }, [product?.id, recommendationsRetry]);

  const viewProduct = (item) => {
    onNavigate(`/customer_product/detail?id=${encodeURIComponent(item.id)}`);
  };
  const addToCart = async (goToCheckout = false) => {
    if (!product) return;
    setCartBusy(true);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(product.id, quantity);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${product.name} added to your cart.`);
      if (goToCheckout) onNavigate('/customer_checkout');
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  const addRelatedProduct = async (item) => {
    setCartBusy(true);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(item.id, 1);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${item.name} added to your cart.`);
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  if (loading) return <main className="cd-main"><p className="cp-empty" role="status">Loading product…</p></main>;
  if (error) return <main className="cd-main"><p className="cp-empty" role="alert">{error}</p></main>;
  if (!product) return <main className="cd-main"><p className="cp-empty">Product not found.</p><a href="/customer_product">Back to products</a></main>;

  return <div className="customer-detail">
    <main className="cd-main">
      {cartError && <p className="cp-empty" role="alert">{cartError}</p>}
      {cartMessage && <p className="cp-empty" role="status">{cartMessage}</p>}
      {wishlistError && <p className="cp-empty" role="alert">{wishlistError}</p>}
      <nav className="cd-breadcrumb" aria-label="Breadcrumb"><a href="/storefront">⌂</a><span>›</span><a href="/storefront">Home</a><span>›</span><a href="/customer_product">Products</a><span>›</span><a href={`/customer_product?category=${encodeURIComponent(product.categoryName || '')}`}>{product.categoryName || 'Category unavailable'}</a><span>›</span><b>{product.name}</b></nav>
      <section className="cd-product">
        <div className="cd-gallery">
          {product.imageUrl && <div className="cd-thumbnails"><button type="button" className="active" aria-label={`View ${product.name} image`}><img src={product.imageUrl} alt="" /></button></div>}
          <div className="cd-main-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>No product image</span>}</div>
        </div>
        <div className="cd-summary">
          <span className="cd-brand-name">{product.categoryName || 'Product'}</span>
          <h1>{product.name}</h1>
          <div className="cd-price"><strong>${Number(product.price).toFixed(2)}</strong></div>
          <p className="cd-description">{product.description || 'No description provided.'}</p>
          <label className="cd-field-name">Category</label>
          <p>{product.categoryName || 'Category unavailable'}</p>
          <label className="cd-field-name">Quantity</label>
          <div className="cd-quantity">
            <button type="button" onClick={() => setQuantity((count) => Math.max(1, count - 1))} aria-label="Decrease quantity">−</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((count) => Math.min(product.quantity || 1, count + 1))} disabled={quantity >= product.quantity} aria-label="Increase quantity">＋</button>
          </div>
          <div className="cd-buy-actions">
            <button type="button" className="cd-add" onClick={() => addToCart()} disabled={product.quantity < 1 || cartBusy}>{cartBusy ? 'Adding…' : '♧  Add to Cart'}</button>
            <button type="button" className="cd-buy" onClick={() => addToCart(true)} disabled={product.quantity < 1 || cartBusy}>ϟ &nbsp; Buy Now</button>
            <button type="button" className={`cd-wishlist ${favorite ? 'active' : ''}`} disabled={wishlistLoading || isProductBusy(product.id)} onClick={() => toggleProduct(product.id).catch(() => {})}>{favorite ? '♥' : '♡'} &nbsp; {favorite ? 'Remove from Wishlist' : 'Add to Wishlist'}</button>
          </div>
        </div>
        <aside className="cd-features"><div className="cd-feature-brand">Product details</div><div className="cd-feature"><span>▧</span><p><b>Category</b><small>{product.categoryName || 'Not categorized'}</small></p></div><div className="cd-feature"><span>▣</span><p><b>Product ID</b><small>{product.id}</small></p></div></aside>
      </section>
      <div className="cd-service-row"><div><span>♧</span><p><b>Free Delivery</b><small>3-5 business days</small></p></div><div><span>⟳</span><p><b>7 Days Replacement</b><small>Easy Returns</small></p></div><div><span>⬡</span><p><b>Secure Payment</b><small>100% Secure</small></p></div></div>
      <section className="cd-detail-tabs"><nav aria-label="Product information tabs">{['Description', 'Specifications', "What's in the Box", 'Reviews'].map((tab) => <button type="button" key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav><div className="cd-tab-panels">
        <article className="cd-info-panel"><h2>{activeTab === 'Description' ? 'About this item' : activeTab}</h2>{activeTab === 'Description' ? <p>{product.description || 'No description provided.'}</p> : activeTab === 'Specifications' ? <dl><dt>Product ID</dt><dd>{product.id}</dd><dt>Category</dt><dd>{product.categoryName || 'Not categorized'}</dd><dt>Price</dt><dd>${Number(product.price).toFixed(2)}</dd></dl> : activeTab === "What's in the Box" ? <p>Package details are not provided.</p> : <p>Review information is not available.</p>}</article>
        <article className="cd-spec-panel"><h2>Product Information</h2><dl><dt>Product ID</dt><dd>{product.id}</dd><dt>Category</dt><dd>{product.categoryName || 'Not categorized'}</dd><dt>Price</dt><dd>${Number(product.price).toFixed(2)}</dd></dl></article>
        <article className="cd-reviews-panel"><h2>Customer Reviews</h2><p>Review information is not available.</p></article>
      </div></section>
      <section className="cd-related" aria-labelledby="similar-products-heading">
        <header><div><h2 id="similar-products-heading">Similar Products</h2><p>Related products based on this item</p></div><a href="/customer_product">View All →</a></header>
        {!localStorage.getItem('access_token') && !localStorage.getItem('refresh_token')
          ? <p className="cd-related-message">Sign in to view product recommendations. <a href="/">Login / Register</a></p>
          : recommendationsLoading
            ? <p className="cd-related-message" role="status">Loading similar products…</p>
            : recommendationsError
              ? <p className="cd-related-message" role="alert">{recommendationsError} <button type="button" onClick={() => setRecommendationsRetry((retry) => retry + 1)}>Retry</button></p>
              : productRecommendations.length
                ? <div className="cd-related-grid">{productRecommendations.map((item) => <article className="cd-related-card" key={item.id}><RelatedProductImage product={item} onView={() => viewProduct(item)} /><button className="cd-related-name" type="button" onClick={() => viewProduct(item)}>{item.name}</button><div><small>{item.categoryName || 'Category unavailable'}</small></div><strong>${Number(item.price).toFixed(2)}</strong><button className="cd-related-add" type="button" disabled={Number(item.quantity) < 1 || cartBusy} onClick={() => addRelatedProduct(item)}>{cartBusy ? 'Adding…' : '♧  Add to Cart'}</button></article>)}</div>
                : <p className="cd-related-message">No similar in-stock products are available right now.</p>}
      </section>
    </main>
  </div>;
}
