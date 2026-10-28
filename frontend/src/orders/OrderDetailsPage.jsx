const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function OrderDetailsPage({ order, onBack }) {
  if (!order) {
    return <section className="orders-page"><button className="orders-back" type="button" onClick={onBack}>← Back to Orders</button><div className="orders-empty">Order details are unavailable.</div></section>;
  }

  return (
    <section className="orders-page">
      <div className="orders-detail-heading">
        <div><button className="orders-back" type="button" onClick={onBack}>← All Orders</button><div className="orders-title-row"><h1>Order Details</h1><span className={`orders-status ${order.statusClass || order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div><p>Workspace / Orders / Order Details / #{order.orderNumber || order.id}</p></div>
        <div className="orders-detail-actions"><button type="button" onClick={() => window.print()}>⎙ Print</button><button type="button" onClick={() => window.print()}>⇩ Download Invoice</button></div>
      </div>
      <div className="order-details-layout">
        <div className="order-details-main">
          <section className="order-info-grid">
            <article className="order-info-card"><span className="orders-customer large"><i>{order.initials}</i><span><strong>{order.customer}</strong><small>{order.email}</small></span></span><button type="button">View Customer</button></article>
            <article className="order-info-card"><h2>Shipping Address</h2><strong>{order.customer}</strong><p>{order.address}</p>{order.country && <small>{order.country}</small>}</article>
          </section>
          <section className="order-line-items">
            <h2>Order Items</h2>
            <table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>QUANTITY</th><th>TOTAL</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.key}><td><span className="order-item"><i>📦</i><strong>{item.name}</strong></span></td><td>{money(item.price)}</td><td>{item.quantity}</td><td>{money(item.subtotal ?? item.price * item.quantity)}</td></tr>)}</tbody></table>
            <div className="order-totals"><span>Subtotal <b>{money(order.subtotal ?? order.amount)}</b></span><span>Shipping <b>{money(order.shippingFee ?? 0)}</b></span><strong>Total <b>{money(order.amount)}</b></strong></div>
            <div className="order-payment-info"><span>Payment Method<br /><strong>{order.method}</strong></span><span>Payment Status<br /><b className={`orders-payment ${order.payment.toLowerCase()}`}>{order.payment}</b></span><button type="button">Track Order</button></div>
          </section>
        </div>
        <aside className="order-timeline-card"><h2>Order Timeline</h2><ol><li className="complete"><i>✓</i><span><strong>Order Created</strong><small>{order.date}</small></span></li><li className="complete"><i>✓</i><span><strong>{order.status}</strong><small>Current status</small></span></li></ol></aside>
      </div>
    </section>
  );
}
