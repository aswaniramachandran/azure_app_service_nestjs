import { useMemo, useState } from 'react';
import { sampleOrders } from '../orders/ordersData.js';
import { analyticsSample } from './analyticsData.js';

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);

function KpiCards({ products }) {
  const cards = [
    ['Total Sales', '$12,482', '18%', 'blue', '▱'],
    ['Total Orders', '342', '12%', 'green', '▤'],
    ['New Customers', '128', '20%', 'violet', '♙'],
    ['Conversion Rate', '3.8%', '0.6%', 'orange', '◉'],
    ['Avg. Order Value', '$36.5', '10%', 'red', '$'],
  ];
  return <div className="analytics-kpis">
    {cards.map(([label, value, change, color, icon]) => <article className="analytics-kpi" key={label}>
      <span className={`analytics-kpi-icon ${color}`}>{icon}</span>
      <div><small>{label}</small><strong>{value}</strong><em>↑ {change} <span>vs last week</span></em></div>
    </article>)}
  </div>;
}

function SalesChart() {
  const { dates, sales, orders } = analyticsSample;
  const points = (values) => values.map((value, index) => `${34 + index * 48},${94 - value / 28}`).join(' ');
  return <article className="analytics-card analytics-sales-card">
    <div className="analytics-card-heading"><div><h2>Sales Overview</h2><p>Total sales for the selected period.</p></div><span className="analytics-chart-legend"><i className="sales-dot" /> Sales <i className="orders-dot" /> Orders</span></div>
    <div className="analytics-line-chart">
      <div className="analytics-y-labels"><span>$2,500</span><span>$2,000</span><span>$1,500</span><span>$1,000</span><span>$500</span><span>$0</span></div>
      <div className="analytics-line-plot">
        <div className="analytics-grid-lines"><i /><i /><i /><i /><i /><i /></div>
        <svg viewBox="0 0 330 104" preserveAspectRatio="none" role="img" aria-label="Sales and orders line chart">
          <polyline className="analytics-sales-line" points={points(sales)} />
          <polyline className="analytics-orders-line" points={points(orders)} />
          {sales.map((value, index) => <circle key={`s${value}-${index}`} cx={34 + index * 48} cy={94 - value / 28} r="2.2" className="analytics-sales-point" />)}
          {orders.map((value, index) => <circle key={`o${value}-${index}`} cx={34 + index * 48} cy={94 - value / 28} r="1.8" className="analytics-orders-point" />)}
        </svg>
        <div className="analytics-x-labels">{dates.map((date) => <span key={date}>{date}</span>)}</div>
      </div>
    </div>
  </article>;
}

function CategoryChart() {
  const gradient = useMemo(() => {
    let start = 0;
    const stops = analyticsSample.categories.map((item) => {
      const from = start;
      start += item.share;
      return `${item.color} ${from}% ${start}%`;
    });
    return `conic-gradient(${stops.join(',')})`;
  }, []);
  return <article className="analytics-card analytics-category-card">
    <div className="analytics-card-heading"><div><h2>Sales by Product Category</h2><p>Revenue contribution by category.</p></div></div>
    <div className="analytics-category-content">
      <div className="analytics-donut" style={{ '--analytics-donut': gradient }}><div><strong>$12,482</strong><small>Total Sales</small></div></div>
      <div className="analytics-category-legend">{analyticsSample.categories.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{money(item.amount)}</strong><small>{item.share}%</small></div>)}</div>
    </div>
  </article>;
}

function TopProducts({ products }) {
  const productRanks = [
    { name: 'Wireless Headphones', units: 88, revenue: 4300, icon: '🎧' },
    { name: 'Smartwatch Pro', units: 64, revenue: 3200, icon: '⌚' },
    { name: 'Bluetooth Speaker', units: 48, revenue: 2160, icon: '🔊' },
    { name: 'Earbuds', units: 42, revenue: 1680, icon: '🎧' },
    { name: 'Laptop Sleeve', units: 37, revenue: 1110, icon: '💼' },
  ];
  const ranked = productRanks.map((item) => {
    const match = products.find((product) => String(product.name).toLowerCase() === item.name.toLowerCase());
    return match ? { ...item, name: match.name, revenue: Number(match.price) * item.units, live: true } : { ...item, live: false };
  }).sort((left, right) => right.revenue - left.revenue);
  return <article className="analytics-card analytics-top-products">
    <div className="analytics-card-heading"><div><h2>Top Selling Products</h2><p>Best performing products by sales.</p></div><span>View all →</span></div>
    <table><thead><tr><th>#</th><th>PRODUCT</th><th>UNITS SOLD</th><th>REVENUE</th></tr></thead><tbody>
      {ranked.map((item, index) => <tr key={item.name}><td>{index + 1}.</td><td><i>{item.icon}</i><span><strong>{item.name}</strong><small>{item.live ? 'Live product record · sample sales' : 'Sample sales'}</small></span></td><td>{item.units}</td><td>{money(item.revenue)}</td></tr>)}
    </tbody></table>
  </article>;
}

function StatusChart() {
  return <article className="analytics-card analytics-status-card">
    <div className="analytics-card-heading"><div><h2>Orders by Status</h2><p>Order count by current status.</p></div></div>
    <div className="analytics-bars">{analyticsSample.orderStatuses.map((status) => <div className="analytics-bar-column" key={status.label}><strong>{status.value}</strong><i style={{ height: `${status.value / 2.1}px`, background: status.color }} /><small>{status.label}</small></div>)}</div>
  </article>;
}

function CustomerChart() {
  return <article className="analytics-card analytics-customer-chart">
    <div className="analytics-card-heading"><div><h2>Customer Growth</h2><p>New vs returning customers.</p></div><span className="analytics-chart-legend"><i className="new-customer-dot" /> New <i className="returning-customer-dot" /> Returning</span></div>
    <div className="analytics-growth-chart">{analyticsSample.customers.map((count, index) => <div className="analytics-growth-col" key={analyticsSample.dates[index]}><div><i style={{ height: `${count / 2.2}px` }} /><b style={{ height: `${analyticsSample.returning[index] / 2.2}px` }} /></div><small>{analyticsSample.dates[index]}</small></div>)}</div>
  </article>;
}

function RecentActivity() {
  const activities = [
    ['▱', 'New order received', 'ORD-1047 · From Emily Wilson', 'Apr 27, 2025 10:42 AM', 'Order', 'purple'],
    ['★', 'Product review submitted', 'Wireless Headphones · 5 stars', 'Apr 27, 2025 09:18 AM', 'Review', 'orange'],
    ['♙', 'New customer registered', 'Michael Brown', 'Apr 26, 2025 08:54 AM', 'Customer', 'blue'],
    ['↩', 'Refund processed', 'REF-2457 · $149.99', 'Apr 25, 2025 07:32 AM', 'Refund', 'red'],
  ];
  return <article className="analytics-card analytics-activity-card"><div className="analytics-card-heading"><div><h2>Recent Activity</h2><p>Latest events in your store.</p></div></div>
    <div className="analytics-activity-list">{activities.map(([icon, title, description, time, tag, color]) => <div className="analytics-activity" key={title}><i className={color}>{icon}</i><span><strong>{title}</strong><small>{description}</small></span><time>{time}</time><b className={color}>{tag}</b><span className="activity-arrow">›</span></div>)}</div>
  </article>;
}

function Locations() {
  return <article className="analytics-card analytics-locations-card"><div className="analytics-card-heading"><div><h2>Top Locations</h2><p>Sales by customer location.</p></div></div><div className="analytics-locations-content">
    <div className="analytics-map" aria-label="Illustrative world map with sales locations"><i /><i /><i /><i /><i /><span className="map-land land-one" /><span className="map-land land-two" /><span className="map-land land-three" /><span className="map-land land-four" /></div>
    <table><thead><tr><th>COUNTRY</th><th>SALES</th><th>SHARE</th></tr></thead><tbody>{analyticsSample.locations.map((location) => <tr key={location.country}><td><i />{location.country}</td><td>{money(location.sales)}</td><td>{location.share}</td></tr>)}</tbody></table>
  </div></article>;
}

export default function AnalyticsPage({ products = [], onViewProducts }) {
  const [rangeStart, setRangeStart] = useState('2025-04-21');
  const [rangeEnd, setRangeEnd] = useState('2025-04-27');
  const [range, setRange] = useState('Apr 21, 2025 - Apr 27, 2025');
  const [showRange, setShowRange] = useState(false);
  const liveInventoryValue = products.reduce((total, product) => total + Number(product.price || 0) * Number(product.quantity || 0), 0);
  const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
  return <section className="analytics-page">
    <div className="analytics-heading-row"><div><div className="analytics-breadcrumb">Workspace <b>/</b> <strong>Analytics</strong></div><h1>Analytics</h1><p>Track your store performance and make data-driven decisions.</p></div>
      <div className="analytics-heading-actions"><div className="analytics-date-wrap"><button type="button" className="analytics-date-button" aria-expanded={showRange} onClick={() => setShowRange((open) => !open)}><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="10" rx="1.4" /><path d="M5 2v3M11 2v3M2.5 6.5h11" /></svg>{range}<span>⌄</span></button>{showRange && <div className="analytics-date-popover"><label>Start<input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} /></label><label>End<input type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} /></label><button type="button" onClick={() => { if (rangeStart && rangeEnd && rangeStart <= rangeEnd) setRange(`${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`); setShowRange(false); }}>Apply</button></div>}</div><button type="button" className="analytics-export" onClick={() => window.print()}>⇩ Export Report</button></div>
    </div>
    <KpiCards products={products} />
    <div className="analytics-grid analytics-grid-top"><SalesChart /><CategoryChart /></div>
    <div className="analytics-grid analytics-grid-middle"><TopProducts products={products} /><StatusChart /><CustomerChart /></div>
    <div className="analytics-grid analytics-grid-bottom"><RecentActivity /><Locations /></div>
    <p className="analytics-data-note">Sales, order, customer, category, and location metrics are illustrative sample data because no Analytics API is available. Product inventory is loaded from the database. {liveInventoryValue ? `Current inventory value: ${money(liveInventoryValue)}.` : ''} {onViewProducts && <button type="button" onClick={onViewProducts}>View live products</button>}</p>
  </section>;
}
