import { useEffect, useState } from 'react';
import { useCustomerWishlist } from '../customer_wishlist/useCustomerWishlist.js';
import {
  cancelCustomerOrder,
  fetchCustomerOrder,
  fetchCustomerOrders,
} from './customerOrderApi.js';
import './customer-order.css';

const orderStatuses = [
  { label: 'Payment Pending', value: 'payment_pending' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];
const ordersPageSize = 10;

function formatStatus(status) {
  return String(status || 'unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
}

function formatPayment(method) {
  const labels = {
    cod: 'Cash on Delivery',
    card: 'Credit / Debit Card',
    upi: 'UPI',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
  };
  return labels[method] || method || 'Unavailable';
}

function Brand() {
  return <a className="co-brand" href="/storefront" aria-label="Stockroom home"><span className="co-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function ProductImage({ item }) {
  return item.imageUrl
    ? <img src={item.imageUrl} alt={item.productName || 'Ordered product'} />
    : <span className="co-product-placeholder" aria-label={item.productName || 'Ordered product'}>{(item.productName || '?').slice(0, 1)}</span>;
}

function Status({ status }) {
  return <span className={`co-status ${String(status || '').toLowerCase().replaceAll('_', '-')}`}>{formatStatus(status)}</span>;
}

function OrderCard({ order, onTrack }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return <article className="co-order-card">
    <div className="co-order-top">
      <div><button className="co-order-id" type="button" onClick={() => onTrack(order.id)}>Order #{order.orderNumber || order.id}</button><small>Placed on {formatDate(order.createdAt)}</small></div>
      <Status status={order.status} />
      <strong className="co-order-amount">${(Number(order.totalAmount) || 0).toFixed(2)}</strong>
      <button className="co-view-details" type="button" onClick={() => onTrack(order.id)}>View Details <span>→</span></button>
    </div>
    <div className="co-order-products"><small>{items.length} {items.length === 1 ? 'item' : 'items'}</small><div>{items.slice(0, 2).map((item) => <span className="co-order-thumb" key={item.id}><ProductImage item={item} /></span>)}{items.length > 2 && <span className="co-more-items">+{items.length - 2}</span>}</div></div>
  </article>;
}

function Footer() {
  return <footer className="co-footer"><div className="co-footer-main"><div className="co-footer-about"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="co-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Twitter">𝕏</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="co-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="co-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>;
}

function OrdersSidebar() {
  return <aside className="co-sidebar" aria-label="Customer account navigation">
    <nav>
      <a href="/storefront"><span aria-hidden="true">⌂</span>Overview</a>
      <a className="active" href="/customer_order" aria-current="page"><span aria-hidden="true">▣</span>My Orders</a>
      <a href="/customer_profile"><span aria-hidden="true">♙</span>My Profile</a>
      <a href="/customer_wishlist"><span aria-hidden="true">♡</span>Wishlist</a>
      <button type="button" disabled aria-disabled="true"><span aria-hidden="true">◇</span>Coupons</button>
    </nav>
  </aside>;
}

export default function CustomerOrderPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: ordersPageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get('order')),
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const { error: wishlistError } = useCustomerWishlist();
  const orderId = new URLSearchParams(window.location.search).get('order');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(orderSearch.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [orderSearch]);

  useEffect(() => {
    let isCurrent = true;
    setOrderLoading(true);
    setOrderError('');
    fetchCustomerOrders({
      status: appliedStatus,
      search: searchQuery,
      page: currentPage,
      limit: ordersPageSize,
    })
      .then((response) => {
        if (isCurrent) {
          setOrders(response.data);
          setPaginationMeta(response.meta);
        }
      })
      .catch((error) => { if (isCurrent) setOrderError(error.message || 'Unable to load your orders.'); })
      .finally(() => { if (isCurrent) setOrderLoading(false); });
    return () => { isCurrent = false; };
  }, [appliedStatus, currentPage, searchQuery]);

  useEffect(() => {
    let isCurrent = true;
    setSelectedOrder(null);
    setActionMessage('');
    setActionError('');
    if (!orderId) {
      setSelectedOrderLoading(false);
      return () => { isCurrent = false; };
    }
    setSelectedOrderLoading(true);
    fetchCustomerOrder(orderId)
      .then((record) => { if (isCurrent) setSelectedOrder(record); })
      .catch((error) => { if (isCurrent) setActionError(error.message || 'Unable to load this order.'); })
      .finally(() => { if (isCurrent) setSelectedOrderLoading(false); });
    return () => { isCurrent = false; };
  }, [orderId]);

  const pageCount = paginationMeta.totalPages;
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstVisiblePage + index,
  );
  const openOrder = (id) => onNavigate(`/customer_order?order=${encodeURIComponent(id)}`);
  const returnToOrders = () => onNavigate('/customer_order');
  const canCancel = ['placed', 'confirmed', 'payment_pending'].includes(selectedOrder?.status);
  const openFilters = () => {
    setDraftStatus(appliedStatus);
    setFiltersOpen((open) => !open);
  };
  const applyFilters = () => {
    setAppliedStatus(draftStatus);
    setCurrentPage(1);
    setFiltersOpen(false);
  };
  const cancelFilters = () => {
    setDraftStatus(appliedStatus);
    setFiltersOpen(false);
  };
  const selectPage = (page) => setCurrentPage(page);

  const cancelOrder = async () => {
    setActionBusy(true);
    setActionError('');
    setActionMessage('');
    try {
      const updatedOrder = await cancelCustomerOrder(selectedOrder.id);
      setSelectedOrder(updatedOrder);
      setOrders((current) => current.map((order) => order.id === updatedOrder.id ? updatedOrder : order));
      setActionMessage('Order cancelled successfully.');
    } catch (error) {
      setActionError(error.message || 'Unable to cancel this order.');
    } finally {
      setActionBusy(false);
    }
  };

  const shippingAddress = selectedOrder ? [
    selectedOrder.fullName,
    selectedOrder.phoneNumber,
    selectedOrder.addressLine1,
    selectedOrder.addressLine2,
    [selectedOrder.city, selectedOrder.state, selectedOrder.pincode].filter(Boolean).join(', '),
    selectedOrder.country,
  ].filter(Boolean) : [];
  const detailItems = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];

  return <div className="customer-order">
    <div className="co-page-layout">
      <OrdersSidebar />
      <main className="co-main">
        {wishlistError && <p role="alert">{wishlistError}</p>}
        {!orderId && orderError && <p className="co-empty" role="alert">{orderError}</p>}
        {selectedOrderLoading ? <p className="co-empty" role="status">Loading order details…</p> : orderId ? selectedOrder ? <>
          <button className="co-back" type="button" onClick={returnToOrders}>← &nbsp; Back to Orders</button>
          <section className="co-hero co-track-hero"><div><span>ORDER DETAILS</span><h1>Order #{selectedOrder.orderNumber || selectedOrder.id}</h1><p>Placed on {formatDate(selectedOrder.createdAt)}</p></div></section>
          {actionMessage && <p className="co-empty" role="status">{actionMessage}</p>}
          {actionError && <p className="co-empty" role="alert">{actionError}</p>}
          <div className="co-track-content">
            <section className="co-track-card"><div className="co-track-heading"><div><b className="co-order-id">Order #{selectedOrder.orderNumber || selectedOrder.id}</b><small>Placed on {formatDate(selectedOrder.createdAt)}</small></div><Status status={selectedOrder.status} /><div className="co-order-detail-actions"><button className="co-track-order-link" type="button" onClick={() => onNavigate(`/customer_order/tracking?order=${encodeURIComponent(selectedOrder.id)}`)}>Track Order</button>{canCancel && <button className="co-view-details" type="button" disabled={actionBusy} onClick={cancelOrder}>{actionBusy ? 'Cancelling…' : 'Cancel Order'}</button>}</div></div></section>
            <div className="co-track-columns">
              <section className="co-info-card"><h2>Order Summary</h2><div className="co-event"><div><b>Payment Method</b><p>{formatPayment(selectedOrder.paymentMethod)}</p></div></div><div className="co-event"><div><b>Payment Status</b><p>{formatStatus(selectedOrder.paymentStatus)}</p></div></div><div className="co-event"><div><b>Shipping Method</b><p>{formatStatus(selectedOrder.shippingMethod)}</p></div></div><div className="co-event"><div><b>Subtotal</b><p>${(Number(selectedOrder.subtotal) || 0).toFixed(2)}</p></div></div><div className="co-event"><div><b>Shipping Fee</b><p>${(Number(selectedOrder.shippingFee) || 0).toFixed(2)}</p></div></div><div className="co-event"><div><b>Total Amount</b><p>${(Number(selectedOrder.totalAmount) || 0).toFixed(2)}</p></div></div></section>
              <section className="co-info-card co-address-card"><h2>Shipping Address</h2><p>{shippingAddress.map((line) => <span key={line}>{line}<br /></span>)}</p></section>
            </div>
            <section className="co-info-card co-items-card"><h2>Products <span>{detailItems.length} items</span></h2>{detailItems.map((item) => <article className="co-track-item" key={item.id}><span className="co-track-thumb"><ProductImage item={item} /></span><div><b>{item.productName}</b><small>Quantity: {item.quantity}</small></div><strong>${(Number(item.subtotal) || Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}<small>${(Number(item.unitPrice) || 0).toFixed(2)} each</small></strong></article>)}</section>
          </div>
        </> : <p className="co-empty" role="alert">{actionError || 'Order not found.'}</p> : <>
          <section className="co-hero"><div><span>MY ORDERS</span><h1>Your Orders</h1><p>Track, manage and view your recent orders.</p></div><div className="co-hero-bag" aria-hidden="true">♧</div></section>
          <section className="co-orders-panel">
            <div className="co-filters">
              <span className="co-all-orders">All Orders ({paginationMeta.total})</span>
              <div className="co-order-tools">
                <label className="co-order-search"><span aria-hidden="true">⌕</span><input type="search" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search order ID, product name..." aria-label="Search orders" /></label>
                <div className="co-filter-control">
                  <button className={`co-filter-toggle ${filtersOpen ? 'active' : ''}`} type="button" aria-expanded={filtersOpen} aria-haspopup="dialog" onClick={openFilters}><span aria-hidden="true">☷</span>Filters{appliedStatus && <i>1</i>}<b aria-hidden="true">›</b></button>
                  {filtersOpen && <section className="co-filter-popover" role="dialog" aria-label="Filter orders">
                    <header><strong>Filters</strong><button type="button" onClick={() => setDraftStatus('')}>Clear all</button></header>
                    <fieldset><legend>Order Status</legend>
                      <label><input type="checkbox" checked={!draftStatus} onChange={() => setDraftStatus('')} />All Orders</label>
                      {orderStatuses.map(({ label, value }) => <label key={value}><input type="checkbox" checked={draftStatus === value} onChange={(event) => setDraftStatus(event.target.checked ? value : '')} />{label}</label>)}
                    </fieldset>
                    <footer><button type="button" onClick={cancelFilters}>Cancel</button><button type="button" onClick={applyFilters}>Apply</button></footer>
                  </section>}
                </div>
              </div>
            </div>
            {orderLoading ? <div className="co-empty" role="status">Loading your orders…</div> : orderError ? null : orders.length ? <>
              <div className="co-order-list">{orders.map((order) => <OrderCard key={order.id} order={order} onTrack={openOrder} />)}</div>
              {pageCount > 1 && <nav className="co-pagination" aria-label="Orders pagination">
                <button type="button" aria-label="Previous page" disabled={!paginationMeta.hasPreviousPage} onClick={() => selectPage(paginationMeta.page - 1)}>‹</button>
                {pageNumbers.map((page) => <button key={page} type="button" className={paginationMeta.page === page ? 'active' : ''} aria-current={paginationMeta.page === page ? 'page' : undefined} onClick={() => selectPage(page)}>{page}</button>)}
                <button type="button" aria-label="Next page" disabled={!paginationMeta.hasNextPage} onClick={() => selectPage(paginationMeta.page + 1)}>›</button>
              </nav>}
            </> : <div className="co-empty">{searchQuery || appliedStatus ? 'No orders match your search or filters.' : 'You have no orders yet.'}</div>}
          </section>
        </>}
      </main>
    </div>
    <Footer />
  </div>;
}
