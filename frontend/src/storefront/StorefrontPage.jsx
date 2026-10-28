import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/storefront.css';
import { addCustomerCartItem, notifyCustomerCartUpdated } from '../customer_cart/customerCartApi.js';
import { useCustomerWishlist } from '../customer_wishlist/useCustomerWishlist.js';
import { fetchCustomerCategories, fetchCustomerProducts } from '../customer_product/customerCatalogApi.js';
import { fetchCustomerRecommendations } from '../customer_product/customerRecommendationApi.js';

const imageUrl = (id, width = 480) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

function Brand() {
  return <a className="store-brand" href="/storefront" aria-label="Stockroom home"><span className="store-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function StoreCategoryImage({ imageUrl }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  function handleImageError() {
    console.error('Category image failed to load:', imageUrl);
    setFailed(true);
  }

  return imageUrl && !failed
    ? <img src={imageUrl} alt="" loading="lazy" onError={handleImageError} />
    : <span className="store-category-image-placeholder" aria-hidden="true">▧</span>;
}

function ProductCard({ product, onAdd, disabled, isFavorite, onFavorite, favoriteBusy }) {
  const image = product.imageUrl || (product.image ? imageUrl(product.image) : '');
  const price = Number(product.price) || 0;
  return <article className="shop-product-card">
    <div className="shop-product-image">
      {image && <a className="shop-product-image-link" href={`/customer_product/detail?id=${encodeURIComponent(product.id)}`} aria-label={`View ${product.name} details`}><img src={image} alt={product.name} loading="lazy" /></a>}
      {product.tag && <span className="shop-product-tag">{product.tag}</span>}
      <button className={`shop-favorite ${isFavorite ? 'is-favorite' : ''}`} type="button" disabled={favoriteBusy} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${product.name} ${isFavorite ? 'from' : 'to'} favorites`} onClick={() => onFavorite()}>{isFavorite ? '♥' : '♡'}</button>
    </div>
    <div className="shop-product-info">
      <small>{product.categoryName || product.category || 'Product'}</small>
      <h3><a href={`/customer_product/detail?id=${encodeURIComponent(product.id)}`}>{product.name}</a></h3>
      {product.rating != null && <div className="shop-rating"><span>★★★★★</span><small>{product.rating}</small></div>}
      <div className="shop-price-row"><strong>${price.toFixed(2)}</strong>{Number(product.originalPrice) > price && <del>${Number(product.originalPrice).toFixed(2)}</del>}</div>
      <button className="shop-add-button" type="button" disabled={disabled} onClick={() => onAdd(product)}>{disabled ? 'Adding…' : 'Add to Cart'} <span>＋</span></button>
    </div>
  </article>;
}

function RecommendationProductCard({ product, onAdd, adding }) {
  const [imageFailed, setImageFailed] = useState(false);
  const price = Number(product.price);
  const inStock = Number(product.quantity) > 0;
  const explanation = product.aiExplanation || product.reason;
  const detailUrl = `/customer_product/detail?id=${encodeURIComponent(product.id)}`;

  return <article className="shop-recommendation-card">
    <a className="shop-recommendation-image" href={detailUrl} aria-label={`View ${product.name} details`}>
      {product.imageUrl && !imageFailed
        ? <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
        : <span aria-hidden="true">▧</span>}
    </a>
    <div className="shop-recommendation-info">
      <h3><a href={detailUrl}>{product.name}</a></h3>
      <strong className="shop-recommendation-price">{Number.isFinite(price) ? `$${price.toFixed(2)}` : 'Price unavailable'}</strong>
      <span className={`shop-recommendation-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
        {inStock ? 'In stock' : 'Out of stock'}
      </span>
      {explanation && <p className="shop-recommendation-reason">{explanation}</p>}
      <div className="shop-recommendation-actions">
        <a href={detailUrl}>View Product</a>
        <button type="button" disabled={!inStock || adding} onClick={() => onAdd(product)}>
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </div>
  </article>;
}

function RecommendationsSection() {
  const authenticated = Boolean(
    localStorage.getItem('access_token') || localStorage.getItem('refresh_token'),
  );
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(authenticated);
  const [error, setError] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const requestId = useRef(0);

  const loadRecommendations = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const items = await fetchCustomerRecommendations(8);
      if (currentRequestId === requestId.current) setRecommendations(items);
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setRecommendations([]);
        setError(requestError.message || 'Unable to load recommendations.');
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return undefined;
    loadRecommendations();
    const refreshRecommendations = () => loadRecommendations();
    window.addEventListener('customer-cart-updated', refreshRecommendations);
    return () => {
      requestId.current += 1;
      window.removeEventListener('customer-cart-updated', refreshRecommendations);
    };
  }, [authenticated, loadRecommendations]);

  const addToCart = async (product) => {
    if (Number(product.quantity) <= 0) return;
    setAddingProductId(product.id);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(product.id, 1);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${product.name} added to your cart.`);
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  return <section className="store-section shop-recommendations" aria-labelledby="recommendations-heading">
    <div className="store-section-heading">
      <div><h2 id="recommendations-heading">Recommended for You</h2><p>Picks based on your shopping activity</p></div>
    </div>
    {!authenticated
      ? <p className="shop-recommendation-message">Sign in to see recommendations picked for you. <a href="/">Login / Register</a></p>
      : loading
        ? <div className="shop-recommendation-grid" aria-label="Loading recommendations" role="status">
          {Array.from({ length: 4 }, (_, index) => <div className="shop-recommendation-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}
        </div>
        : error
          ? <div className="shop-recommendation-message" role="alert">{error} <button type="button" onClick={loadRecommendations}>Retry</button></div>
          : recommendations.length === 0
            ? <p className="shop-recommendation-message">No recommendations yet. Browse products and add items to your cart to get personalized picks.</p>
            : <div className="shop-recommendation-grid">
              {recommendations.map((product) => <RecommendationProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                adding={addingProductId === product.id}
              />)}
            </div>}
    {cartError && <p className="shop-recommendation-feedback" role="alert">{cartError}</p>}
    {cartMessage && <p className="shop-recommendation-feedback" role="status">{cartMessage}</p>}
  </section>;
}

export default function StorefrontPage({ search, onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const {
    items: wishlistItems,
    loading: wishlistLoading,
    error: wishlistError,
    isProductBusy,
    toggleProduct,
  } = useCustomerWishlist();
  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCategories()
      .then((records) => { if (isCurrent) setCategories(records); })
      .catch((requestError) => {
        if (isCurrent) setCategoriesError(requestError.message || 'Unable to load categories.');
      })
      .finally(() => { if (isCurrent) setCategoriesLoading(false); });
    return () => { isCurrent = false; };
  }, []);

    useEffect(() => {
      let isCurrent = true;
      const searchTerm = search.trim();
      const timeoutId = window.setTimeout(() => {
      setProductsLoading(true);
      setProductsError('');
      fetchCustomerProducts('', '', '', '', searchTerm)
        .then((records) => { if (isCurrent) setProducts(records); })
        .catch((requestError) => {
          if (isCurrent) {
            setProducts([]);
            setProductsError(requestError.message || 'Unable to load products.');
          }
        })
        .finally(() => { if (isCurrent) setProductsLoading(false); });
    }, searchTerm ? 250 : 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const searchTerm = search.trim();
  const featuredProducts = searchTerm ? products : products.slice(0, 5);

  const addToCart = async (product) => {
    setCartBusy(true);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(product.id, 1);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${product.name} added to your cart.`);
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  return <>
    <main id="home">
      <section className="store-hero">
        <div className="store-hero-copy"><span className="store-kicker">NEW COLLECTION</span><h1>Premium Audio,<br />Made for You</h1><p>Wireless headphones for<br />your world.</p><strong>Up to <em>40% OFF</em></strong><a href="#featured">Shop Now <span>→</span></a></div>
        <div className="store-hero-perks"><div><span>◎</span><p><b>Crystal Clear Sound</b><small>Deep bass, balanced highs</small></p></div><div><span>◷</span><p><b>Long Battery Life</b><small>Listen longer, charge less</small></p></div><div><span>◉</span><p><b>Noise Cancellation</b><small>Block out the noise</small></p></div></div>
        <div className="store-hero-dots"><i className="active" /><i /><i /><i /></div>
      </section>
      {!searchTerm && <section className="store-section store-categories" id="categories">
        <div className="store-section-heading"><div><h2>Shop by Category</h2><p>Explore our wide range of products</p></div><a href="#featured">View All Categories <span>→</span></a></div>
        <div className="store-category-grid">{categoriesLoading ? <p className="store-no-results" role="status">Loading categories…</p> : categoriesError ? <p className="store-no-results" role="alert">Categories could not be loaded: {categoriesError}</p> : categories.length ? categories.map((category) => <button className="store-category-card" type="button" key={category.id} onClick={() => onNavigate(`/customer_product?categoryId=${encodeURIComponent(category.id)}`)}><StoreCategoryImage imageUrl={category.imageUrl} /><b>{category.name}</b><small>{(category.productCount ?? category.count) != null ? `${category.productCount ?? category.count} Products` : 'Browse products'}</small></button>) : <p className="store-no-results">No categories are available.</p>}</div>
      </section>}
      {!searchTerm && <RecommendationsSection />}
      <section className="store-section" id="featured">
        <div className="store-section-heading"><div><h2>{searchTerm ? 'Search Results' : 'Featured Products'}</h2><p>{searchTerm ? `Products matching “${search.trim()}”` : 'Top picks just for you'}</p></div>{!searchTerm && <a href="/customer_product">View All <span>→</span></a>}</div>
        {cartError && <p className="store-no-results" role="alert">{cartError}</p>}
        {cartMessage && <p className="store-no-results" role="status">{cartMessage}</p>}
        {wishlistError && <p className="store-no-results" role="alert">{wishlistError}</p>}
        <div className="store-product-grid">{productsLoading ? <p className="store-no-results" role="status">Loading products…</p> : productsError ? <p className="store-no-results" role="alert">{productsError}</p> : featuredProducts.length ? featuredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} disabled={cartBusy} isFavorite={wishlistItems.some((item) => Number(item.productId) === Number(product.id))} favoriteBusy={wishlistLoading || isProductBusy(product.id)} onFavorite={() => toggleProduct(product.id).catch(() => {})} />) : <p className="store-no-results">No products match your search. Try another name or category.</p>}</div>
      </section>
      {!searchTerm && <section className="store-promo-grid">
        <article className="store-promo promo-watch"><div><small>UP TO 30% OFF</small><h2>Smartwatch Collection</h2><p>Track your goals, live better.</p><a href="#featured">Shop Now →</a></div><img src={imageUrl('photo-1523275335684-37898b6baf30', 360)} alt="Smartwatch collection" loading="lazy" /></article>
        <article className="store-promo promo-gaming"><div><small>GAMING GEAR</small><h2>Level Up Your Game</h2><p>Quality gear. Serious performance.</p><a href="#featured">Explore →</a></div><img src={imageUrl('photo-1593305841991-05c297ba4575', 360)} alt="Gaming collection" loading="lazy" /></article>
      </section>}
      <section className="store-section store-reviews" id="reviews">
        <div className="store-section-heading"><div><h2>What Our Customers Say</h2><p>Real reviews from real people</p></div><a href="#reviews">View All Reviews <span>→</span></a></div>
        <div className="store-review-grid">{[['RK','Rishik Rathi','Amazing sound quality and super fast delivery! The headphones are so comfortable.'],['PM','Priya Mehta','Great products at a great price. I absolutely love my new earbuds!'],['AM','Amit Verma','Easy to shop, excellent customer service, and the quality is top-notch.']].map(([initials, name, quote]) => <article className="store-review-card" key={name}><div className="store-review-person"><span>{initials}</span><b>{name}<small>Verified Customer</small></b></div><div className="store-review-stars">★★★★★</div><p>“{quote}”</p><small>April 10, 2025</small></article>)}</div>
      </section>
      <section className="store-newsletter"><span className="store-newsletter-icon">✉</span><div><h2>Join Our Newsletter</h2><p>Get the latest news, exclusive offers, and more.</p></div><form onSubmit={(event) => { event.preventDefault(); if (newsletterEmail.trim()) setSubscribed(true); }}><input type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Enter your email address" aria-label="Email address" /><button type="submit">{subscribed ? 'Subscribed ✓' : 'Subscribe'}</button></form></section>
    </main>
    <footer className="store-footer"><div className="store-footer-main"><div className="store-footer-about"><Brand /><p>Your one-stop shop for premium electronics and accessories. Quality products, great prices, exceptional service.</p><div className="store-socials"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="Twitter">𝕏</a><a href="#footer" aria-label="YouTube">▶</a></div></div><div><h3>Quick Links</h3><a href="#home">Home</a><a href="#categories">Shop</a><a href="#featured">Deals</a><a href="#reviews">About Us</a></div><div><h3>Customer Service</h3><a href="#footer">Contact Us</a><a href="#footer">Shipping Policy</a><a href="#footer">Returns &amp; Refunds</a><a href="#footer">FAQs</a></div><div><h3>My Account</h3><a href="/customer_profile">My Profile</a><a href="/customer_order">Order History</a><a href="/customer_wishlist">Wishlist</a><a href="/customer_order">Track Order</a></div><div><h3>We Accept</h3><div className="store-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>▰</span></div></div></div><div className="store-footer-bottom"><span>© 2025 stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Contact</a></div></div></footer>
  </>;
}
