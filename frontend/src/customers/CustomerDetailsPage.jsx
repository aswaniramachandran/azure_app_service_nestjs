import { useState } from 'react';
import { sampleCustomerOrders } from './customerData.js';

const cash = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function CustomerDetailsPage({ customer, onBack, onViewHistory, onViewOrder }) {
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Order History', 'Addresses', 'Reviews', 'Notes'];
  const events = [
    ['▤', 'Placed an order', 'Order #ORD-1047', 'Apr 28, 2025 · 10:24 AM', 'purple'],
    ['＄', 'Account updated', 'Profile information changed', 'Apr 23, 2025 · 02:15 PM', 'orange'],
    ['✓', 'Logged in', 'From Toronto, Canada', 'Apr 19, 2025 · 09:43 AM', 'green'],
    ['♙', 'Registered', 'Customer account created', customer.joined, 'blue'],
  ];

  if (!customer) return <section className="customers-page"><p>Customer details unavailable.</p><button className="customer-outline-button" onClick={onBack}>Back to Customers</button></section>;

  return (
    <section className="customers-page">
      <div className="customers-crumb">Workspace <b>/</b> Customers <b>/</b> Customer Details</div>
      <section className="customer-profile-hero">
        <span className={`customer-avatar profile ${customer.color}`}>{customer.initials}</span>
        <div className="customer-profile-name"><h1>{customer.name}</h1><span className={`customer-status ${customer.status.toLowerCase()}`}>{customer.status}</span><small>✉ &nbsp;{customer.email}</small><small>♧ &nbsp;{customer.phone}</small><small>♧ &nbsp;Customer since {customer.joined}</small></div>
        <div className="customer-quick-stats"><article><small>Total Orders</small><strong>{customer.orders}</strong></article><article><small>Total Spent</small><strong>{cash(customer.spent)}</strong></article><article><small>Avg. Order Value</small><strong>{cash(customer.spent / customer.orders)}</strong></article></div>
      </section>
      <nav className="customer-tabs">{tabs.map((item) => <button type="button" key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); if (item === 'Order History') onViewHistory(); }}>{item}</button>)}</nav>
      {tab === 'Overview' ? (
        <div className="customer-overview-grid">
          <div className="customer-overview-left">
            <section className="customer-card"><h2>Customer Information</h2><dl><div><dt>Full Name</dt><dd>{customer.name}</dd></div><div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Phone</dt><dd>{customer.phone}</dd></div><div><dt>Location</dt><dd>{customer.location}</dd></div><div><dt>Customer Since</dt><dd>{customer.joined}</dd></div><div><dt>Status</dt><dd><span className={`customer-status ${customer.status.toLowerCase()}`}>{customer.status}</span></dd></div></dl></section>
            <section className="customer-card customer-mini-chart"><h2>Total Orders</h2><div>{[30, 46, 27, 56, 39, 65, 48, 78, 42].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></section>
          </div>
          <div className="customer-overview-middle">
            <section className="customer-card customer-activity"><h2>Recent Activity</h2><ul>{events.map(([icon, title, detail, date, color]) => <li key={title}><i className={color}>{icon}</i><span><strong>{title}</strong><small>{detail}</small><small>{date}</small></span></li>)}</ul></section>
            <section className="customer-card customer-top-categories"><h2>Top Categories</h2><ul>{customer.categories.map((category, index) => <li key={category}><i>{['🎧', '⌚', '🔊', '🎒'][index % 4]}</i><span>{category}</span><small>{[3, 2, 1, 1][index]}</small></li>)}</ul></section>
          </div>
          <div className="customer-overview-right">
            <section className="customer-card customer-address"><h2>Shipping Address</h2><strong>{customer.name}</strong><p>{customer.location === 'Toronto, Canada' ? '123 Queen Street West, Toronto, ON M5H 2M9, Canada' : `248 Main Street, ${customer.location}`}</p><button type="button" className="customer-outline-button">Edit</button><button type="button" className="customer-outline-button wide">＋ Add New Address</button></section>
            <section className="customer-card customer-quick-actions"><h2>Quick Actions</h2><button type="button">▤ &nbsp; View Orders</button><button type="button">✉ &nbsp; Send Email</button><button type="button">✎ &nbsp; Edit Note</button><button type="button" className="danger">♧ &nbsp; Block Customer</button></section>
          </div>
          <section className="customer-card customer-recent-orders"><header><h2>Recent Orders</h2><button type="button" onClick={onViewHistory}>View All</button></header><ul>{sampleCustomerOrders.slice(0, 3).map((order) => <li key={order.id} onClick={() => onViewOrder(order)}><strong>#{order.id}</strong><span>{order.date}</span><b>{cash(order.amount)}</b><span className={`customer-order-status ${order.status.toLowerCase()}`}>{order.status}</span></li>)}</ul></section>
        </div>
      ) : (
        <section className="customer-card customer-tab-placeholder"><h2>{tab}</h2><p>{tab === 'Addresses' ? 'Saved addresses for this customer.' : tab === 'Reviews' ? 'Customer product reviews.' : 'Customer notes.'}</p><small>This section has no connected backend data.</small></section>
      )}
      <p className="customers-data-note">Customer profile metrics and activity shown here are sample UI data; no customer API is connected.</p>
    </section>
  );
}
