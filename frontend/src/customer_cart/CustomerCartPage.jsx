import { useCallback, useEffect, useState } from 'react';
import {
  clearCustomerCart,
  fetchCustomerCart,
  notifyCustomerCartUpdated,
  removeCustomerCartItem,
  updateCustomerCartItem,
} from './customerCartApi.js';
import './customer-cart.css';

const imageUrl = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=85`;

function Brand() {
  return <a className="cart-brand" href="/storefront" aria-label="Stockroom home"><span className="cart-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function CartProduct({ item, onChange, busy }) {
  const price = Number(item.price) || 0;
  return <article className="cart-row">
    <a className="cart-product-image" href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : '▧'}</a>
    <div className="cart-product-details"><a href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.name}</a><small>Product</small></div>
    <div className="cart-item-price"><strong>${price.toFixed(2)}</strong></div>
    <div className="cart-quantity"><button type="button" aria-label={item.quantity <= 1 ? `Remove ${item.name} from cart` : `Decrease ${item.name} quantity`} disabled={busy} onClick={() => onChange(item, item.quantity <= 1 ? null : item.quantity - 1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} disabled={busy} onClick={() => onChange(item, item.quantity + 1)}>＋</button></div>
    <strong className="cart-line-total">${(Number(item.subtotal) || price * item.quantity).toFixed(2)}</strong>
    <button className="cart-delete" type="button" aria-label={`Remove ${item.name}`} disabled={busy} onClick={() => onChange(item, null)}>▤</button>
  </article>;
}

export default function CustomerCartPage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal ?? Number(item.price) * Number(item.quantity)), 0);
  const total = totalAmount;

  const applyCartResponse = useCallback((cart) => {
    const cartItems = Array.isArray(cart?.items) ? cart.items : [];
    setItems(cartItems);
    setTotalAmount(Number(cart?.totalAmount) || cartItems.reduce(
      (sum, item) => sum + Number(item.subtotal ?? Number(item.price) * Number(item.quantity)),
      0,
    ));
    notifyCustomerCartUpdated({ totalItems: cart?.totalItems ?? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) });
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      applyCartResponse(await fetchCustomerCart());
    } catch (requestError) {
      setItems([]);
      setError(requestError.message || 'Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  }, [applyCartResponse]);

  useEffect(() => {
    loadCart();
    const syncCart = (event) => {
      const cart = event.detail?.cart;
      if (!Array.isArray(cart?.items)) return;
      setItems(cart.items);
      setTotalAmount(Number(cart.totalAmount) || cart.items.reduce(
        (sum, item) => sum + Number(item.subtotal ?? Number(item.price) * Number(item.quantity)),
        0,
      ));
    };
    window.addEventListener('customer-cart-updated', syncCart);
    return () => window.removeEventListener('customer-cart-updated', syncCart);
  }, [loadCart]);

  async function changeItem(item, quantity) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const cart = quantity == null
        ? await removeCustomerCartItem(item.id)
        : await updateCustomerCartItem(item.id, quantity);
      applyCartResponse(cart);
      setSuccess(quantity == null ? 'Item removed from your cart.' : 'Cart quantity updated.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update your cart.');
    } finally {
      setBusy(false);
    }
  }

  async function clearCart() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await clearCustomerCart();
      applyCartResponse({ items: [], totalItems: 0 });
      setSuccess('Cart cleared successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to clear your cart.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="customer-cart">
    <main className="cart-main">
      <section className="cart-hero"><div><span>YOUR CART</span><h1>Shopping Cart</h1><p>Review your items and proceed to checkout when you're ready.</p></div><img src={imageUrl('photo-1505740420928-5e560c06d30e')} alt="Featured audio products" /></section>
      {error && <p className="cart-api-message cart-api-error" role="alert">{error}</p>}
      {success && <p className="cart-api-message cart-api-success" role="status">{success}</p>}
      <div className="cart-layout">
        <section className="cart-items-panel"><header className="cart-panel-heading"><div><h2>My Cart <small>({itemCount} items)</small></h2></div>{items.length > 0 && <button type="button" onClick={clearCart} disabled={busy}>Clear Cart <span>▤</span></button>}</header>
          {loading ? <div className="cart-empty" role="status">Loading your cart…</div> : error && items.length === 0 ? <div className="cart-empty"><h2>Unable to load your cart</h2><p>{error}</p><button type="button" onClick={loadCart}>Try Again</button></div> : items.length > 0 ? <>
            <div className="cart-table-heading"><span>Product</span><span>Price</span><span>Quantity</span><span>Total</span><span>Action</span></div>
            <div className="cart-rows">{items.map((item) => <CartProduct key={item.id} item={item} busy={busy} onChange={changeItem} />)}</div>
            <div className="cart-bottom-actions"><span /> <a href="/customer_product">← &nbsp; Continue Shopping</a></div>
          </> : <div className="cart-empty"><span>▱</span><h2>Your cart is empty</h2><p>Looks like you haven't added anything to your cart yet.</p><a href="/customer_product">Continue Shopping</a></div>}
        </section>
        <aside className="cart-summary"><h2>Order Summary</h2><div className="cart-summary-line"><span>Subtotal ({itemCount} items)</span><strong>${subtotal.toFixed(2)}</strong></div><div className="cart-summary-line"><span>Total items</span><strong>{itemCount}</strong></div><div className="cart-summary-total"><b>Total</b><strong>${total.toFixed(2)}</strong></div><button className="cart-checkout" type="button" disabled={!items.length || loading || Boolean(error)} onClick={() => onNavigate('/customer_checkout')}>♙ &nbsp; Proceed to Checkout</button><a className="cart-continue" href="/customer_product">♧ &nbsp; Continue Shopping</a><div className="cart-secure"><span>⬡</span><p><b>Secure Checkout</b><small>Your information is safe and encrypted.</small></p></div><div className="cart-payment-methods"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></aside>
      </div>
    </main>
    <footer className="cart-footer"><div className="cart-footer-inner"><div className="cart-footer-brand"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="cart-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Twitter">𝕏</a><a href="#footer" aria-label="Pinterest">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="cart-footer-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="cart-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
