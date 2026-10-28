import { useEffect, useMemo, useState } from 'react';
import { cartItemCount, fetchCustomerCart, notifyCustomerCartUpdated } from '../customer_cart/customerCartApi.js';
import {
  completeCustomerDemoPayment,
  createCustomerOrder,
} from '../customer_order/customerOrderApi.js';
import CustomerOrderSuccess from '../customer_order/CustomerOrderSuccess.jsx';
import '../customer_order/customer-order-success.css';
import './customer-payment.css';

const paymentMethods = [
  { id: 'card', icon: '▤', name: 'Credit / Debit Card', detail: 'Pay securely with your card', badges: ['VISA', '●●', 'AMEX', 'RuPay'] },
  { id: 'upi', icon: '◉', name: 'UPI', detail: 'Pay using any UPI app', badges: ['G Pay', 'PhonePe', 'Paytm', 'BHIM'] },
  { id: 'paypal', icon: 'ℙ', name: 'PayPal', detail: 'Pay with your PayPal account', badges: ['PayPal'] },
  { id: 'apple', icon: '●', name: 'Apple Pay', detail: 'Pay with Apple Pay', badges: ['Pay'] },
  { id: 'cod', icon: '♧', name: 'Cash on Delivery', detail: 'Pay when you receive your order', badges: ['COD'] },
];

function Brand() {
  return <a className="payment-brand" href="/storefront" aria-label="Stockroom home"><span className="payment-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function OrderItem({ item }) {
  return <article className="payment-order-item"><a className="payment-item-photo" href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : '▧'}</a><div className="payment-item-info"><a href={`/customer_product/detail?id=${encodeURIComponent(item.productId)}`}>{item.name}</a><small>Product</small><span className="payment-item-quantity">{item.quantity} item(s)</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></article>;
}

export default function CustomerPaymentPage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(() => {
    const savedMethod = localStorage.getItem('stockroom_checkout_payment') || 'card';
    return savedMethod === 'apple_pay' ? 'apple' : savedMethod;
  });
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);
  const discount = 0;
  const promoDiscount = promoApplied ? Math.max(0, subtotal - discount) * 0.1 : 0;
  const tax = Math.max(0, subtotal - discount - promoDiscount) * 0.1;
  const shipping = localStorage.getItem('stockroom_checkout_shipping') === 'express' ? 12 : 0;
  const total = Math.max(0, subtotal - discount - promoDiscount + tax + shipping);

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCart()
      .then((cart) => {
        if (!isCurrent) return;
        const cartItems = Array.isArray(cart?.items) ? cart.items : [];
        setItems(cartItems);
        notifyCustomerCartUpdated({
          totalItems: cart?.totalItems ?? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        });
      })
      .catch((requestError) => { if (isCurrent) setError(requestError.message || 'Unable to load your cart.'); })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, []);

  const payNow = async (event) => {
    event.preventDefault();
    if (!items.length) {
      setOrderError(error || 'Your cart is empty. Add products before continuing.');
      return;
    }
    if (selectedMethod !== 'cod' && !event.currentTarget.checkValidity()) {
      setOrderError('Enter the requested demo payment details to continue.');
      return;
    }

    setMessage('');
    setOrderError('');
    setOrderSubmitting(true);
    try {
      let order = pendingOrder;
      if (!order) {
        let address;
        try {
          address = JSON.parse(localStorage.getItem('stockroom_checkout_address') || 'null');
        } catch (parseError) {
          console.error('Could not read the saved checkout address.', parseError);
          setOrderError('Your saved shipping address could not be read. Return to checkout and enter it again.');
          return;
        }
        if (
          !address ||
          ['fullName', 'phone', 'address1', 'city', 'pincode', 'state', 'country']
            .some((field) => typeof address[field] !== 'string' || !address[field].trim())
        ) {
          setOrderError('Enter and save your complete shipping address before placing the order.');
          return;
        }

        order = await createCustomerOrder({
          fullName: address.fullName.trim(),
          phoneNumber: address.phone.trim(),
          addressLine1: address.address1.trim(),
          addressLine2: address.address2?.trim() || undefined,
          city: address.city.trim(),
          pincode: address.pincode.trim(),
          state: address.state.trim(),
          country: address.country.trim(),
          shippingMethod: localStorage.getItem('stockroom_checkout_shipping') || 'standard',
          paymentMethod: selectedMethod === 'apple' ? 'apple_pay' : selectedMethod,
        });

        notifyCustomerCartUpdated({ totalItems: 0, items: [], totalAmount: 0 });
        if (selectedMethod !== 'cod') setPendingOrder(order);
      }

      if (selectedMethod === 'cod') {
        setCreatedOrder(order);
        setItems([]);
      } else {
        let paymentResult;
        try {
          paymentResult = await completeCustomerDemoPayment(order.payment?.id);
        } catch (paymentError) {
          setOrderError(`Demo payment failed: ${paymentError.message || 'Please try again.'}`);
          return;
        }
        setCreatedOrder({
          ...order,
          status: paymentResult.orderStatus,
          paymentStatus: paymentResult.paymentStatus,
          payment: {
            ...order.payment,
            status: paymentResult.paymentStatus,
            transactionId: paymentResult.transactionId,
          },
        });
        setPendingOrder(null);
        setItems([]);
      }

      localStorage.removeItem('stockroom_checkout_payment');
      localStorage.removeItem('stockroom_checkout_address');
      localStorage.removeItem('stockroom_checkout_shipping');
    } catch (requestError) {
      setOrderError(requestError.message || 'Unable to complete your order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  return <div className="customer-payment">
    <main className="payment-main">
      {createdOrder ? <CustomerOrderSuccess order={createdOrder} onNavigate={onNavigate} /> : <>
      <nav className="payment-progress" aria-label="Checkout progress"><a href="/customer_checkout?step=1"><b>✓</b><span>Address<small>Delivery details</small></span></a><i /><a href="/customer_checkout?step=2"><b>✓</b><span>Shipping<small>Choose shipping method</small></span></a><i /><span className="current"><b>3</b><span>Payment<small>Complete your payment</small></span></span><i /><a href="/customer_checkout?step=2"><b>4</b><span>Review<small>Final confirmation</small></span></a></nav>
      <div className="payment-layout">
        <form className="payment-options" onSubmit={payNow}>
          <header className="payment-title"><span>PAYMENT METHOD</span><h1>Choose Your Payment Method</h1><p>All transactions are secure and encrypted. Your information is safe with us.</p></header>
          <div className="payment-method-list">{paymentMethods.map((method) => <section className={`payment-method-card ${selectedMethod === method.id ? 'selected' : ''}`} key={method.id}>
            <label className="payment-method-heading"><input type="radio" name="paymentMethod" value={method.id} checked={selectedMethod === method.id} disabled={Boolean(pendingOrder)} onChange={() => { setSelectedMethod(method.id); localStorage.setItem('stockroom_checkout_payment', method.id === 'apple' ? 'apple_pay' : method.id); setMessage(''); }} /><span className="payment-method-icon">{method.icon}</span><span className="payment-method-label"><strong>{method.name}</strong><small>{method.detail}</small></span><span className="payment-method-badges">{method.badges.map((badge) => <i key={badge}>{badge}</i>)}</span></label>
            {selectedMethod === method.id && method.id === 'card' && <div className="payment-card-fields"><label>Card Number <b>*</b><span>▤<input required inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" /></span></label><label>Name on Card <b>*</b><span>♙<input required autoComplete="cc-name" placeholder="John Doe" /></span></label><label>Expiry Date <b>*</b><span>▣<input required autoComplete="cc-exp" placeholder="MM / YY" /></span></label><label>CVV <b>*</b><span>♙<input required inputMode="numeric" autoComplete="cc-csc" placeholder="123" /></span></label></div>}
            {selectedMethod === method.id && method.id === 'upi' && <div className="payment-extra-field"><label>Demo UPI ID <b>*</b><input required placeholder="demo@bank" /></label></div>}
            {selectedMethod === method.id && method.id === 'paypal' && <div className="payment-extra-field"><label>Demo PayPal Email <b>*</b><input required type="email" placeholder="demo@example.com" /></label></div>}
            {selectedMethod === method.id && method.id === 'apple' && <div className="payment-extra-field"><label>Demo Apple Pay Name <b>*</b><input required placeholder="Demo Customer" /></label></div>}
          </section>)}</div>
          {orderError && <p className="payment-message" role="alert">{orderError}</p>}
          {message && <p className="payment-message" role="status">{message}</p>}
          <div className="payment-form-actions"><a href="/customer_checkout?step=2">← &nbsp; Back to Shipping</a><button type="submit" disabled={loading || Boolean(error) || !items.length || orderSubmitting}>{orderSubmitting ? pendingOrder ? 'Processing Demo Payment…' : 'Placing Order…' : selectedMethod === 'cod' ? 'Place Order' : `♙  Pay Now  $${total.toFixed(2)}`}</button></div>
        </form>
        <aside className="payment-summary"><header><h2>Order Summary</h2><span>{cartItemCount(items)} items</span></header>{loading ? <p role="status">Loading cart…</p> : error ? <p className="payment-message" role="alert">{error}</p> : <div className="payment-order-list">{items.map((item) => <OrderItem key={item.id} item={item} />)}</div>}<div className="payment-promo"><label><span>♧</span><input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Have a promo code?" /></label><button type="button" disabled={loading || Boolean(error)} onClick={() => { if (promo.trim()) { setPromoApplied(true); setMessage('Promo applied: 10% off.'); } }}>Apply</button></div><div className="payment-totals"><div><span>Subtotal ({cartItemCount(items)} items)</span><strong>${subtotal.toFixed(2)}</strong></div><div className="discount"><span>Discount</span><strong>-${(discount + promoDiscount).toFixed(2)}</strong></div><div><span>Shipping</span><strong>{shipping ? `$${shipping.toFixed(2)}` : 'Free'}</strong></div><div><span>Tax (10%)</span><strong>${tax.toFixed(2)}</strong></div><div className="total"><b>Total</b><strong>${total.toFixed(2)}</strong></div></div><div className="payment-secure"><span>⬡</span><p><strong>Secure Payment</strong><small>Your payment information is encrypted and secure.</small></p></div><div className="payment-all-badges"><i>VISA</i><i>●●</i><i>AMEX</i><i>PayPal</i><i>Pay</i><i>UPI</i></div></aside>
      </div>
      </>}
    </main>
    <footer className="payment-footer"><div className="payment-footer-inner"><div className="payment-footer-brand"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div><a href="#footer">f</a><a href="#footer">◎</a><a href="#footer">▶</a><a href="#footer">𝕏</a><a href="#footer">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="payment-footer-badges"><i>VISA</i><i>●●</i><i>PayPal</i><i>UPI</i></div></div></div><div className="payment-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
