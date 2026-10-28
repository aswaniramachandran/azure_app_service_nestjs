import { sampleCustomerOrders } from './customerData.js';

const cash = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function CustomerOrderHistoryPage({ customer, onBack, onViewOrder }) {
  return (
    <section className="customers-page">
      <div className="customers-crumb">Workspace <b>/</b> Customers <b>/</b> Order History</div>
      <div className="customer-history-heading">
        <div><span className={`customer-avatar large ${customer.color}`}>{customer.initials}</span><span><h1>Order History</h1><p>View all orders placed by this customer.</p></span></div>
        <button type="button" className="customer-outline-button" onClick={onBack}>← Customer Details</button>
      </div>
      <section className="customer-summary-bar">
        <div className="customer-summary-profile"><span className={`customer-avatar ${customer.color}`}>{customer.initials}</span><span><strong>{customer.name}</strong><small>{customer.email}</small><small>{customer.phone}</small></span></div>
        <button type="button" className="customer-outline-button" onClick={onBack}>View Details</button>
        <article><span className="customer-stat-icon violet">▤</span><span><small>Total Orders</small><strong>{customer.orders}</strong></span></article>
        <article><span className="customer-stat-icon green">＄</span><span><small>Total Spent</small><strong>{cash(customer.spent)}</strong></span></article>
        <article><span className="customer-stat-icon orange">◷</span><span><small>Last Order</small><strong>Apr 28, 2025</strong></span></article>
      </section>
      <section className="customers-table-card history-table-card">
        <div className="customers-table-wrap"><table className="customers-table history-table"><thead><tr><th>#</th><th>ORDER ID</th><th>DATE</th><th>PRODUCTS</th><th>TOTAL AMOUNT</th><th>PAYMENT STATUS</th><th>ORDER STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>{sampleCustomerOrders.map((order, index) => <tr key={order.id}><td>{index + 1}</td><td><strong>#{order.id}</strong></td><td>{order.date}</td><td><span className="history-products"><i>📦</i><i>🎧</i><small>{order.products.length} items</small></span></td><td><strong>{cash(order.amount)}</strong></td><td><span className="customer-status active">{order.payment}</span></td><td><span className={`customer-order-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td><button className="customer-view-order" type="button" onClick={() => onViewOrder(order)}>View Details</button><button className="customer-more" type="button" aria-label="More actions">···</button></td></tr>)}</tbody>
        </table></div>
        <footer className="customers-table-footer"><span>Showing 1 to {sampleCustomerOrders.length} of {customer.orders} orders</span><div><button disabled>‹</button><b>1</b><button disabled>›</button></div></footer>
      </section>
      <p className="customers-data-note">Order history is illustrative sample data and is not loaded from the database.</p>
    </section>
  );
}
