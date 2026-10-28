import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
} from './adminOrdersApi.js';

const PAGE_SIZE = 10;
const orderStatuses = [
  ['payment_pending', 'Payment Pending'],
  ['placed', 'Placed'],
  ['confirmed', 'Confirmed'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount) || 0);

const paymentMethodLabels = {
  cod: 'Cash on Delivery',
  card: 'Card',
  upi: 'UPI',
  paypal: 'PayPal',
  apple_pay: 'Apple Pay',
};

function displayStatus(value) {
  return String(value || 'unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function normalizeOrder(order) {
  const user = order.user && typeof order.user === 'object' ? order.user : {};
  const customer = order.fullName || user.name || user.fullName || 'Customer';
  const items = Array.isArray(order.items) ? order.items : [];
  const products = items.map((item) => {
    const name = item.productName || item.name || 'Product';
    const quantity = Number(item.quantity) || 0;
    return `${name}${quantity > 1 ? ` ×${quantity}` : ''}`;
  });
  const rawStatus = String(order.status || 'unknown').toLowerCase();
  const paymentStatus = displayStatus(order.paymentStatus);
  const methodKey = String(order.paymentMethod || '').toLowerCase();
  const createdAt = order.createdAt || order.created_at;
  const address = [
    order.addressLine1,
    order.addressLine2,
    [order.city, order.state, order.pincode].filter(Boolean).join(', '),
    order.country,
  ].filter(Boolean).join(', ');

  return {
    ...order,
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    customer,
    email: order.email || user.email || '',
    initials: customer.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    product: products.length ? products.join(', ') : 'No products',
    items: items.map((item, index) => ({
      ...item,
      name: item.productName || item.name || 'Product',
      quantity: Number(item.quantity) || 0,
      price: Number(item.unitPrice ?? item.price) || 0,
      key: item.id ?? `${item.productId ?? index}`,
    })),
    amount: Number(order.totalAmount ?? order.amount) || 0,
    payment: paymentStatus,
    paymentClass: String(order.paymentStatus || 'unknown').toLowerCase().replaceAll('_', '-'),
    status: displayStatus(rawStatus),
    statusClass: rawStatus.replaceAll('_', '-'),
    date: dateLabel(createdAt),
    method: paymentMethodLabels[methodKey] || displayStatus(methodKey),
    address: address || 'Address unavailable',
    createdAt,
  };
}

function isInDateRange(order, rangeText) {
  const value = rangeText.trim();
  if (!value) return true;
  const match = value.match(/^(.+?)\s+-\s+(.+)$/);
  if (!match) return true;
  const start = new Date(match[1]);
  const end = new Date(match[2]);
  const orderDate = new Date(order.createdAt);
  if ([start, end, orderDate].some((date) => Number.isNaN(date.getTime()))) return true;
  end.setHours(23, 59, 59, 999);
  return orderDate >= start && orderDate <= end;
}

export default function OrdersPage({ page, onViewOrder }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const title = ['Pending Orders', 'Processing Orders', 'Shipped Orders', 'Delivered Orders', 'Cancelled Orders'].includes(page)
    ? page
    : 'All Orders';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError('');
    fetchAdminOrders({
      search: debouncedQuery,
      status: statusFilter,
      page: currentPage,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        if (isCurrent) {
          setOrders(response.data.map(normalizeOrder));
          setPaginationMeta(response.meta);
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Unable to load admin orders.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, [currentPage, debouncedQuery, refreshKey, statusFilter]);

  useEffect(() => setCurrentPage(1), [page, statusFilter]);

  const stats = useMemo(() => {
    const count = (status) => orders.filter((order) => order.statusClass === status).length;
    const definitions = title === 'All Orders'
      ? [['Total Orders', paginationMeta.total, 'purple'], ['Pending', count('payment-pending'), 'orange'], ['Processing', count('processing'), 'blue'], ['Delivered', count('delivered'), 'green']]
      : title === 'Pending Orders'
        ? [['Total Pending', count('payment-pending'), 'red'], ['Today', orders.filter((order) => order.statusClass === 'payment-pending' && new Date(order.createdAt).toDateString() === new Date().toDateString()).length, 'orange'], ['This Week', orders.filter((order) => order.statusClass === 'payment-pending' && Date.now() - new Date(order.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, 'purple']]
        : title === 'Processing Orders'
          ? [['Being Processed', count('processing'), 'blue'], ['Today', orders.filter((order) => order.statusClass === 'processing' && new Date(order.createdAt).toDateString() === new Date().toDateString()).length, 'orange'], ['This Week', orders.filter((order) => order.statusClass === 'processing' && Date.now() - new Date(order.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, 'purple']]
          : title === 'Shipped Orders'
            ? [['Total Shipped', count('shipped'), 'purple'], ['Today', orders.filter((order) => order.statusClass === 'shipped' && new Date(order.createdAt).toDateString() === new Date().toDateString()).length, 'orange'], ['This Week', orders.filter((order) => order.statusClass === 'shipped' && Date.now() - new Date(order.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, 'blue']]
            : title === 'Delivered Orders'
              ? [['Total Delivered', count('delivered'), 'green'], ['This Week', orders.filter((order) => order.statusClass === 'delivered' && Date.now() - new Date(order.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, 'orange'], ['This Month', orders.filter((order) => order.statusClass === 'delivered' && new Date(order.createdAt).getMonth() === new Date().getMonth() && new Date(order.createdAt).getFullYear() === new Date().getFullYear()).length, 'purple']]
              : [['Total Cancelled', count('cancelled'), 'red'], ['Today', orders.filter((order) => order.statusClass === 'cancelled' && new Date(order.createdAt).toDateString() === new Date().toDateString()).length, 'orange'], ['This Week', orders.filter((order) => order.statusClass === 'cancelled' && Date.now() - new Date(order.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, 'purple']];
    return definitions;
  }, [orders, paginationMeta.total, title]);

  const firstOrder = paginationMeta.total
    ? (paginationMeta.page - 1) * paginationMeta.limit + 1
    : 0;
  const lastOrder = Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total);
  const pageOrders = orders.filter((order) => isInDateRange(order, dateFilter));

  const changeOrderStatus = async (order, status) => {
    setStatusError('');
    setUpdatingOrderId(order.id);
    try {
      const updated = await updateAdminOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => item.id === order.id
        ? normalizeOrder({
          ...item,
          ...updated,
          id: item.id,
          orderNumber: item.orderNumber,
          status: updated?.status || status,
        })
        : item));
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setStatusError(requestError.message || 'Unable to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };
  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setStatusFilter('all');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <section className="orders-page">
      <div className="orders-heading">
        <div><span className="orders-kicker">ORDER MANAGEMENT</span><h1>{title}</h1><p>View and manage all customer orders.</p></div>
      </div>

      <div className={`orders-stat-grid ${stats.length === 3 ? 'three' : ''}`}>
        {stats.map(([label, value, color]) => (
          <article className="orders-stat" key={label}>
            <span className={`orders-stat-icon ${color}`}>{label.includes('Delivered') ? '✓' : label.includes('Orders') || label.includes('Processed') ? '▤' : '◷'}</span>
            <div><small>{label}</small><strong>{loading ? '—' : value}</strong><em>{label === 'Total Orders' ? 'all time' : 'orders'}</em></div>
          </article>
        ))}
      </div>

      <section className="orders-table-card">
        <div className="orders-filters">
          <label className="orders-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID, customer..." /></label>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter order status"><option value="all">All Status</option>{orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <input className="orders-date" aria-label="Order date range" placeholder="Date range (e.g. Apr 1, 2026 - Apr 30, 2026)" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          <button type="button" className="orders-filter-clear" onClick={clearFilters} disabled={!query && statusFilter === 'all' && !dateFilter}>Clear Filters</button>
          <button type="button" className="orders-filter-refresh" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading} aria-label="Refresh orders" title="Refresh orders">↻</button>
          <button type="button" className="orders-export" onClick={() => window.print()}>⇩ Export</button>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>PRODUCTS</th><th>AMOUNT</th><th>PAYMENT</th><th>ORDER STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {!loading && !error && pageOrders.map((order) => (
                <tr key={order.id} onClick={() => onViewOrder(order)} tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && onViewOrder(order)}>
                  <td><strong>#{order.orderNumber}</strong></td>
                  <td><span className="orders-customer"><i>{order.initials || '?'}</i><span>{order.customer}<small>{order.email}</small></span></span></td>
                  <td>{order.product}</td>
                  <td><strong>{money(order.amount)}</strong></td>
                  <td><span className={`orders-payment ${order.paymentClass}`}>{order.method} · {order.payment}</span></td>
                  <td>
                    <select
                      className={`orders-status orders-status-select ${order.statusClass}`}
                      aria-label={`Update status for order ${order.orderNumber}`}
                      value={order.statusClass.replaceAll('-', '_')}
                      disabled={updatingOrderId === order.id}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        event.stopPropagation();
                        changeOrderStatus(order, event.target.value);
                      }}
                    >
                      {orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </td>
                  <td>{order.date}</td>
                  <td><button type="button" className="orders-view-button" aria-label={`View order ${order.id}`} onClick={(event) => { event.stopPropagation(); onViewOrder(order); }}>⌕</button><button type="button" className="orders-delete-button" aria-label={`Delete order ${order.id}`} onClick={(event) => event.stopPropagation()}>▣</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {statusError && <div className="orders-empty" role="alert">{statusError}</div>}
        {loading ? <div className="orders-empty" role="status">Loading orders…</div> : error ? <div className="orders-empty" role="alert">{error}</div> : !pageOrders.length && <div className="orders-empty">{dateFilter ? 'No orders match your date range on this page.' : 'No orders match your filters.'}</div>}
        <footer className="orders-table-footer"><span>Showing {firstOrder} to {lastOrder} of {paginationMeta.total} orders</span><div><button type="button" aria-label="Previous page" disabled={!paginationMeta.hasPreviousPage || loading} onClick={() => setCurrentPage(paginationMeta.page - 1)}>‹</button><b>{paginationMeta.totalPages ? paginationMeta.page : 0}</b><button type="button" aria-label="Next page" disabled={!paginationMeta.hasNextPage || loading} onClick={() => setCurrentPage(paginationMeta.page + 1)}>›</button></div></footer>
      </section>
    </section>
  );
}
