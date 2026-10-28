import { useEffect, useMemo, useState } from 'react';
import {
  cartItemCount,
  fetchCustomerCart,
  notifyCustomerCartUpdated,
  removeCustomerCartItem,
  updateCustomerCartItem,
} from '../customer_cart/customerCartApi.js';
import './customer-checkout.css';

function Brand() {
  return <a className="checkout-brand" href="/storefront" aria-label="Stockroom home"><span className="checkout-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

const initialAddress = {
  fullName: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  pincode: '',
  state: '',
  country: '',
};

function readSavedAddress() {
  return { ...initialAddress };
}

function CheckoutItem({ item, onQuantityChange, busy }) {
  return <article className="checkout-item">
    <a className="checkout-item-image" href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : '▧'}</a>
    <div className="checkout-item-info"><a href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.name}</a><small>Product</small><div className="checkout-item-quantity"><button type="button" disabled={busy || item.quantity <= 1} onClick={() => onQuantityChange(item, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" disabled={busy} onClick={() => onQuantityChange(item, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>＋</button></div></div>
    <strong>${(item.price * item.quantity).toFixed(2)}</strong><button className="checkout-remove-item" type="button" disabled={busy} aria-label={`Remove ${item.name}`} onClick={() => onQuantityChange(item, 0)}>▤</button>
  </article>;
}

export default function CustomerCheckoutPage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartBusy, setCartBusy] = useState(false);
  const [address, setAddress] = useState(readSavedAddress);
  const [step, setStep] = useState(() => {
    const requestedStep = Number(new URLSearchParams(window.location.search).get('step'));
    return requestedStep === 2 ? 2 : 1;
  });
  const [shipping, setShipping] = useState(() => localStorage.getItem('stockroom_checkout_shipping') || 'standard');
  const [payment, setPayment] = useState(() => localStorage.getItem('stockroom_checkout_payment') || 'card');
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(false);
  const [error, setError] = useState('');
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.originalPrice) || item.price) * item.quantity, 0), [items]);
  const discount = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, (Number(item.originalPrice) || item.price) - item.price) * item.quantity, 0), [items]);
  const shippingCost = shipping === 'express' && subtotal > 0 ? 12 : 0;
  const promoDiscount = appliedPromo ? Math.max(0, subtotal - discount) * 0.1 : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount - promoDiscount);
  const tax = discountedSubtotal * 0.1;
  const total = Math.max(0, discountedSubtotal + shippingCost + tax);

  const applyCartResponse = (cart) => {
    const cartItems = Array.isArray(cart?.items) ? cart.items : [];
    setItems(cartItems);
    notifyCustomerCartUpdated({
      totalItems: cart?.totalItems ?? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    });
  };

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCart()
      .then((cart) => { if (isCurrent) applyCartResponse(cart); })
      .catch((requestError) => { if (isCurrent) setError(requestError.message || 'Unable to load your cart.'); })
      .finally(() => { if (isCurrent) setCartLoading(false); });
    return () => { isCurrent = false; };
  }, []);

  const updateAddress = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const updateQuantity = async (item, quantity) => {
    setCartBusy(true);
    setError('');
    try {
      const cart = quantity > 0
        ? await updateCustomerCartItem(item.id, quantity)
        : await removeCustomerCartItem(item.id);
      applyCartResponse(cart);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  const continueToPayment = () => {
    const required = ['fullName', 'phone', 'address1', 'city', 'pincode', 'state', 'country'];
    if (required.some((field) => !address[field].trim())) {
      setError('Please complete all required shipping address fields.');
      return;
    }
    setError('');
    localStorage.setItem('stockroom_checkout_address', JSON.stringify(address));
    localStorage.setItem('stockroom_checkout_shipping', shipping);
    localStorage.setItem('stockroom_checkout_payment', payment);
    onNavigate('/customer_payment');
  };

  const handleCheckoutSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!items.length) {
      setError('Your cart is empty. Add products before placing your order.');
      return;
    }
    const required = ['fullName', 'phone', 'address1', 'city', 'pincode', 'state', 'country'];
    if (required.some((field) => !address[field].trim())) {
      setError('Please complete all required shipping address fields.');
      setStep(1);
      return;
    }

    localStorage.setItem('stockroom_checkout_address', JSON.stringify(address));
    localStorage.setItem('stockroom_checkout_shipping', shipping);
    localStorage.setItem('stockroom_checkout_payment', payment);
    onNavigate('/customer_payment');
  };

  return <div className="customer-checkout">
    <main className="checkout-main">
      <section className="checkout-hero"><div><span>SECURE CHECKOUT</span><h1>Complete Your Purchase</h1><p>Fill in your details and choose your payment method to place your order securely.</p></div><div className="checkout-promises"><div><b>⬡</b><span><strong>100% Secure</strong><small>Your information is safe</small></span></div><div><b>♧</b><span><strong>Fast Shipping</strong><small>Get your order soon</small></span></div><div><b>☏</b><span><strong>24/7 Support</strong><small>We're here to help</small></span></div></div></section>
      {cartLoading && <p className="checkout-success" role="status">Loading your cart…</p>}
      {cartBusy && <p className="checkout-success" role="status">Updating your cart…</p>}
      <form className="checkout-layout" onSubmit={handleCheckoutSubmit}>
        <section className="checkout-flow">
          <nav className="checkout-steps" aria-label="Checkout steps">{[['1', 'Shipping Address'], ['2', 'Shipping Method'], ['3', 'Payment Method'], ['4', 'Review & Place Order']].map(([number, label], index) => <button type="button" key={number} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} onClick={() => { if (index === 1 || index === 2) { localStorage.setItem('stockroom_checkout_address', JSON.stringify(address)); localStorage.setItem('stockroom_checkout_shipping', shipping); localStorage.setItem('stockroom_checkout_payment', payment); onNavigate('/customer_payment'); } else if (index === 0) setStep(1); else if (step > index) setStep(index + 1); }}><b>{step > index + 1 ? '✓' : number}</b><span>{label}</span>{index < 3 && <i>→</i>}</button>)}</nav>
          {step === 1 && <section className="checkout-step-panel"><header className="checkout-panel-title"><span>♧</span><div><h2>Shipping Address</h2><p>Enter your delivery address where you want your order to be shipped.</p></div></header><div className="checkout-address-card">
            <div className="checkout-form-grid">
              <label>Full Name <i>*</i><span><input required name="fullName" value={address.fullName} onChange={updateAddress} /></span></label>
              <label>Phone Number <i>*</i><span><input required type="tel" name="phone" value={address.phone} onChange={updateAddress} /></span></label>
              <label className="wide">Address Line 1 <i>*</i><span><input required name="address1" value={address.address1} onChange={updateAddress} /></span></label>
              <label>Address Line 2 (Optional)<span><input name="address2" value={address.address2} onChange={updateAddress} /></span></label>
              <label>City <i>*</i><span><input required name="city" value={address.city} onChange={updateAddress} /></span></label>
              <label>Pincode <i>*</i><span><input required inputMode="numeric" name="pincode" value={address.pincode} onChange={updateAddress} /></span></label>
              <label>State <i>*</i><span><input required name="state" value={address.state} onChange={updateAddress} /></span></label>
              <label>Country <i>*</i><span><input required name="country" value={address.country} onChange={updateAddress} /></span></label>
            </div>
            {error && <p className="checkout-error" role="alert">{error}</p>}
          </div></section>}
          {step > 1 && <button className="checkout-accordion" type="button" onClick={() => setStep(1)}><span className="checkout-accordion-icon">♧</span><span><strong>Shipping Address</strong><small>{address.fullName ? `${address.fullName} · ${address.address1}, ${address.city}` : 'Enter your delivery address'}</small></span><b>⌄</b></button>}
          {step === 2 && <section className="checkout-step-panel"><header className="checkout-panel-title"><span>♧</span><div><h2>Shipping Method</h2><p>Choose your preferred shipping method.</p></div></header><div className="checkout-choice-list"><label><input type="radio" name="shipping" checked={shipping === 'standard'} onChange={() => setShipping('standard')} /><span><b>Standard Shipping</b><small>Delivery in 3–5 business days</small></span><strong>{subtotal >= 50 ? 'Free' : '$5.00'}</strong></label><label><input type="radio" name="shipping" checked={shipping === 'express'} onChange={() => setShipping('express')} /><span><b>Express Shipping</b><small>Delivery in 1–2 business days</small></span><strong>$12.00</strong></label></div><div className="checkout-step-actions"><button type="button" onClick={() => { localStorage.setItem('stockroom_checkout_address', JSON.stringify(address)); localStorage.setItem('stockroom_checkout_shipping', shipping); localStorage.setItem('stockroom_checkout_payment', payment); onNavigate('/customer_payment'); }}>Continue to Payment <span>→</span></button></div></section>}
          {step !== 2 && step > 2 && <button className="checkout-accordion" type="button" onClick={() => setStep(2)}><span className="checkout-accordion-icon">♧</span><span><strong>Shipping Method</strong><small>{shipping === 'standard' ? 'Standard Shipping' : 'Express Shipping'}</small></span><b>⌄</b></button>}
          {step === 3 && <section className="checkout-step-panel"><header className="checkout-panel-title"><span>▤</span><div><h2>Payment Method</h2><p>Select a payment option.</p></div></header><div className="checkout-choice-list checkout-payment-list"><label><input type="radio" name="payment" checked={payment === 'card'} onChange={() => { setPayment('card'); localStorage.setItem('stockroom_checkout_payment', 'card'); }} /><span><b>Credit / Debit Card</b><small>Visa, Mastercard, RuPay</small></span><strong>VISA ·●●</strong></label><label><input type="radio" name="payment" checked={payment === 'upi'} onChange={() => { setPayment('upi'); localStorage.setItem('stockroom_checkout_payment', 'upi'); }} /><span><b>UPI</b><small>Pay with any UPI app</small></span><strong>UPI</strong></label><label><input type="radio" name="payment" checked={payment === 'cod'} onChange={() => { setPayment('cod'); localStorage.setItem('stockroom_checkout_payment', 'cod'); }} /><span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span><strong>COD</strong></label></div>{payment === 'card' && <div className="checkout-card-fields"><label>Card Number<input required inputMode="numeric" placeholder="1234 5678 9012 3456" /></label><label>Cardholder Name<input required placeholder="Name on card" /></label><div><label>Expiry Date<input required placeholder="MM/YY" /></label><label>CVV<input required inputMode="numeric" placeholder="123" /></label></div></div>}<div className="checkout-step-actions"><button type="button" onClick={() => { localStorage.setItem('stockroom_checkout_payment', payment); setStep(4); }}>Save &amp; Continue <span>→</span></button></div></section>}
          {step === 4 && <section className="checkout-step-panel"><header className="checkout-panel-title"><span>✓</span><div><h2>Review &amp; Place Order</h2><p>Confirm your details and place your order.</p></div></header><div className="checkout-review"><b>Shipping to</b><p>{address.fullName} · {address.phone}<br />{address.address1}{address.address2 && `, ${address.address2}`}<br />{address.city}, {address.state} {address.pincode}, {address.country}</p><b>Shipping method</b><p>{shipping === 'standard' ? 'Standard Shipping (3–5 business days)' : 'Express Shipping (1–2 business days)'}</p><b>Payment method</b><p>{payment === 'card' ? 'Credit / Debit Card' : payment === 'upi' ? 'UPI' : payment === 'cod' ? 'Cash on Delivery' : payment}</p></div>{error && <p className="checkout-error" role="alert">{error}</p>}<div className="checkout-step-actions"><button type="submit" disabled={cartLoading || cartBusy}>Continue to Payment <span>→</span></button></div></section>}
        </section>
        <aside className="checkout-summary"><header><h2>Order Summary</h2><span>{cartItemCount(items)} items</span></header><div className="checkout-summary-items">{items.map((item) => <CheckoutItem key={item.id} item={item} onQuantityChange={updateQuantity} busy={cartBusy} />)}</div><div className="checkout-promo"><label><span>♧</span><input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Enter promo code" aria-label="Promo code" /></label><button type="button" onClick={() => { if (promo.trim()) setAppliedPromo(true); }}>Apply</button></div>{appliedPromo && <p className="checkout-promo-message">10% promo discount applied.</p>}<div className="checkout-totals"><div><span>Subtotal ({cartItemCount(items)} items)</span><strong>${subtotal.toFixed(2)}</strong></div><div className="discount"><span>Discount</span><strong>-${(discount + promoDiscount).toFixed(2)}</strong></div><div><span>Shipping</span><strong>{shippingCost ? `$${shippingCost.toFixed(2)}` : subtotal >= 50 || !subtotal ? 'Free' : '$5.00'}</strong></div><div><span>Tax (10%)</span><strong>${tax.toFixed(2)}</strong></div><div className="grand-total"><b>Total</b><strong>${(total + (subtotal > 0 && subtotal < 50 && shipping === 'standard' ? 5 : 0)).toFixed(2)}</strong></div></div><div className="checkout-summary-actions"><button className="checkout-place-order" type="button" disabled={!items.length || cartLoading || cartBusy} onClick={continueToPayment}>Continue to Payment <span>→</span></button><button className="checkout-summary-cancel" type="button" onClick={() => onNavigate('/customer_cart')}>Cancel</button></div><small className="checkout-terms">Continuing means you agree to our <a href="#terms">Terms &amp; Conditions</a> and <a href="#privacy">Privacy Policy</a>.</small></aside>
      </form>
    </main>
    <footer className="checkout-footer"><div className="checkout-footer-inner"><div className="checkout-footer-brand"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="checkout-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Twitter">𝕏</a><a href="#footer" aria-label="Pinterest">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="checkout-footer-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="checkout-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
