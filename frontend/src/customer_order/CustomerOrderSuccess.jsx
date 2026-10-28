function formatPaymentMethod(method) {
  const labels = {
    cod: 'Cash on Delivery',
    card: 'Credit / Debit Card',
    upi: 'UPI',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
  };
  return labels[method] || method || 'Unavailable';
}

function formatStatus(status) {
  return String(status || 'Unavailable')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CustomerOrderSuccess({ order, onNavigate }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const addressLines = [
    order.fullName,
    order.phoneNumber,
    order.addressLine1,
    order.addressLine2,
    [order.city, order.state, order.pincode].filter(Boolean).join(', '),
    order.country,
  ].filter(Boolean);
  const paymentMethod = formatPaymentMethod(order.paymentMethod || order.payment?.method);
  const paymentStatus = formatStatus(order.paymentStatus || order.payment?.status);

  return <section className="order-success">
    <section className="order-success-card" aria-live="polite">
      <span className="order-success-icon" aria-hidden="true">✓</span>
      <p className="order-success-eyebrow">ORDER CONFIRMATION</p>
      <h1>Order Placed Successfully</h1>
      <p className="order-success-payment">Payment: {paymentMethod}</p>
      <p className="order-success-payment-status">Payment Status: {paymentStatus}</p>
      <div className="order-success-overview">
        <div><small>Order Number</small><strong>{order.orderNumber || order.id}</strong></div>
        <div><small>Order Status</small><strong>{formatStatus(order.status)}</strong></div>
        <div><small>Payment Method</small><strong>{paymentMethod}</strong></div>
        <div><small>Payment Status</small><strong>{paymentStatus}</strong></div>
      </div>
      <div className="order-success-columns">
        <section>
          <h2>Products</h2>
          {items.length ? items.map((item) => {
            const price = Number(item.unitPrice) || 0;
            const quantity = Number(item.quantity) || 0;
            const lineTotal = Number(item.subtotal) || price * quantity;
            return <article className="order-success-item" key={item.id || `${item.productId}-${item.productName}`}>
              <div><strong>{item.productName || item.name}</strong><small>Quantity: {quantity} × ${price.toFixed(2)}</small></div>
              <b>${lineTotal.toFixed(2)}</b>
            </article>;
          }) : <p>Order items are unavailable.</p>}
          <div className="order-success-totals">
            <div><span>Subtotal</span><strong>${(Number(order.subtotal) || 0).toFixed(2)}</strong></div>
            <div><span>Shipping Fee</span><strong>${(Number(order.shippingFee) || 0).toFixed(2)}</strong></div>
            <div className="order-success-total"><span>Total Amount</span><strong>${(Number(order.totalAmount) || 0).toFixed(2)}</strong></div>
          </div>
        </section>
        <section>
          <h2>Shipping Address</h2>
          <address>{addressLines.map((line) => <span key={line}>{line}</span>)}</address>
          <p className="order-success-shipping">Shipping method: {formatStatus(order.shippingMethod)}</p>
        </section>
      </div>
      <div className="order-success-actions">
        <button type="button" onClick={() => onNavigate('/customer_order')}>View My Orders</button>
        <button type="button" onClick={() => onNavigate('/customer_product')}>Continue Shopping</button>
      </div>
    </section>
  </section>;
}
