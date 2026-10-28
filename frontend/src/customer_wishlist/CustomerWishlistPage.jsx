import { useEffect, useMemo, useState } from 'react';
import {
  clearCustomerWishlist,
  fetchCustomerWishlist,
  notifyCustomerWishlistUpdated,
  removeCustomerWishlistItem,
} from './customerWishlistApi.js';
import { addCustomerCartItem, notifyCustomerCartUpdated } from '../customer_cart/customerCartApi.js';
import './customer-wishlist.css';

const imageUrl = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=85`;

function Brand() {
  return <a className="cw-brand" href="/storefront" aria-label="Stockroom home"><span className="cw-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function WishlistCard({ product, onRemove, onAddToCart, onBuyNow, cartBusy, wishlistBusy }) {
  const price = Number(product.price) || 0;
  return <article className="cw-product-card">
    <div className="cw-product-image">
      <a href={`/customer_product/detail?id=${encodeURIComponent(product.productId)}`} aria-label={`View ${product.name}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : '▧'}</a>
      <label className="cw-select"><input type="checkbox" aria-label={`Select ${product.name}`} /><span /></label>
      <button className="cw-remove" type="button" aria-label={`Remove ${product.name} from wishlist`} disabled={wishlistBusy} onClick={() => onRemove(product.id)}>♥</button>
    </div>
    <div className="cw-card-info">
      <a className="cw-product-name" href={`/customer_product/detail?id=${encodeURIComponent(product.productId)}`}>{product.name}</a>
      <p>{product.categoryName || 'Category unavailable'}</p>
      <div className="cw-rating"><i>{product.quantity > 0 ? 'In Stock' : 'Out of Stock'}</i></div>
      <div className="cw-price"><strong>${price.toFixed(2)}</strong></div>
      <div className="cw-card-actions"><button type="button" disabled={cartBusy} onClick={() => onAddToCart(product)}>{cartBusy ? 'Adding…' : '♧  Add to Cart'}</button><button type="button" disabled={cartBusy} onClick={() => onBuyNow(product)}>ϟ &nbsp; Buy Now</button></div>
    </div>
  </article>;
}

export default function CustomerWishlistPage({ onNavigate }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let isCurrent = true;
    fetchCustomerWishlist()
      .then((wishlist) => { if (isCurrent) setWishlistItems(wishlist.items); })
      .catch((requestError) => {
        if (isCurrent) setWishlistError(requestError.message || 'Unable to load your wishlist.');
      })
      .finally(() => { if (isCurrent) setWishlistLoading(false); });
    const syncWishlist = (event) => {
      if (Array.isArray(event.detail?.wishlist?.items)) {
        setWishlistItems(event.detail.wishlist.items);
      }
    };
    window.addEventListener('customer-wishlist-updated', syncWishlist);
    return () => {
      isCurrent = false;
      window.removeEventListener('customer-wishlist-updated', syncWishlist);
    };
  }, []);

  const visibleProducts = useMemo(() => wishlistItems.filter((product) =>
    `${product.name} ${product.categoryName || ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [wishlistItems, search]);

  const applyWishlist = (wishlist) => {
    setWishlistItems(wishlist.items);
    notifyCustomerWishlistUpdated(wishlist);
  };

  const removeProduct = async (itemId) => {
    setWishlistBusy(true);
    setWishlistError('');
    try {
      applyWishlist(await removeCustomerWishlistItem(itemId));
    } catch (requestError) {
      setWishlistError(requestError.message || 'Unable to remove this product from your wishlist.');
    } finally {
      setWishlistBusy(false);
    }
  };

  const clearWishlist = async () => {
    setWishlistBusy(true);
    setWishlistError('');
    try {
      applyWishlist(await clearCustomerWishlist());
    } catch (requestError) {
      setWishlistError(requestError.message || 'Unable to clear your wishlist.');
    } finally {
      setWishlistBusy(false);
    }
  };

  const addToCart = async (product, goToCheckout = false) => {
    setCartBusy(true);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(product.productId, 1);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${product.name} added to your cart.`);
      if (goToCheckout) onNavigate('/customer_checkout');
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  return <div className="customer-wishlist">
    <main className="cw-main">
      <section className="cw-hero"><div><span>MY WISHLIST</span><h1>Your Favorite Products</h1><p>Save items you love and get back to them later.</p></div><img src={imageUrl('photo-1505740420928-5e560c06d30e')} alt="Featured audio products" /></section>
      <div className="cw-list-heading"><div><span>♡</span><strong>My Wishlist</strong><small>({wishlistItems.length} Items)</small></div>{wishlistItems.length > 0 && <button type="button" disabled={wishlistBusy} onClick={clearWishlist}>Clear All <span>♧</span></button>}</div>
      {cartError && <p className="cw-empty" role="alert">{cartError}</p>}
      {cartMessage && <p className="cw-empty" role="status">{cartMessage}</p>}
      {wishlistError ? <section className="cw-empty" role="alert"><h2>Unable to load wishlist</h2><p>{wishlistError}</p></section> : wishlistLoading ? <section className="cw-empty" role="status">Loading wishlist…</section> : visibleProducts.length ? <div className="cw-grid">{visibleProducts.map((product) => <WishlistCard key={product.id} product={product} onRemove={removeProduct} onAddToCart={(item) => addToCart(item)} onBuyNow={(item) => addToCart(item, true)} cartBusy={cartBusy} wishlistBusy={wishlistBusy} />)}</div> : <section className="cw-empty"><span>♡</span><h2>{wishlistItems.length ? 'No matching wishlist items' : 'Your wishlist is empty'}</h2><p>{wishlistItems.length ? 'Try another search, or browse your saved products.' : 'Save products you love and they will appear here.'}</p><a href="/customer_product">Continue Shopping →</a></section>}
    </main>
    <footer className="cw-footer"><div className="cw-footer-main"><div className="cw-footer-about"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="cw-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Twitter">𝕏</a><a href="#footer" aria-label="Pinterest">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="cw-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="cw-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
