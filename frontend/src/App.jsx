

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AuthPage from './auth/AuthPage.jsx';
import CategoriesPage from './categories/CategoriesPage.jsx';
import BrandsPage from './brands/BrandsPage.jsx';
import CustomerDetailsPage from './customers/CustomerDetailsPage.jsx';
import CustomerListPage from './customers/CustomerListPage.jsx';
import CustomerOrderHistoryPage from './customers/CustomerOrderHistoryPage.jsx';
import { sampleCustomers } from './customers/customerData.js';
import CouponsPage, { couponPages } from './coupons/CouponsPage.jsx';
import InventoryPage from './inventory/InventoryPage.jsx';
import OrderDetailsPage from './orders/OrderDetailsPage.jsx';
import OrdersPage from './orders/OrdersPage.jsx';
import PaymentPage, { paymentPages } from './payments/PaymentPage.jsx';
import ReviewsPage from './reviews/ReviewsPage.jsx';
import AnalyticsPage from './analytics/AnalyticsPage.jsx';
import SettingsPage from './settings/SettingsPage.jsx';
import { settingsSections } from './settings/settingsData.js';
import StorefrontPage from './storefront/StorefrontPage.jsx';
import CustomerProductPage from './customer_product/CustomerProductPage.jsx';
import CustomerProductDetailPage from './customer_product/CustomerProductDetailPage.jsx';
import CustomerCategoryPage from './customer_category/CustomerCategoryPage.jsx';
import CustomerStoreHeader from './customer_shared/CustomerStoreHeader.jsx';
import CustomerSupportChatbot from './customer_shared/CustomerSupportChatbot.jsx';
import CustomerWishlistPage from './customer_wishlist/CustomerWishlistPage.jsx';
import CustomerCartPage from './customer_cart/CustomerCartPage.jsx';
import CustomerCheckoutPage from './customer_checkout/CustomerCheckoutPage.jsx';
import CustomerPaymentPage from './customer_payment/CustomerPaymentPage.jsx';
import CustomerOrderPage from './customer_order/CustomerOrderPage.jsx';
import CustomerOrderTrackingPage from './customer_order/CustomerOrderTrackingPage.jsx';
import CustomerProfilePage from './customer_profile/CustomerProfilePage.jsx';
import { API_BASE, apiRequest } from './apiClient.js';
import ProductDetailPage from './products/ProductDetailPage.jsx';
import ProductFormPage from './products/ProductFormPage.jsx';
import ProductGalleryPage from './products/ProductGalleryPage.jsx';
import ProductListPage from './products/ProductListPage.jsx';

const LOW_STOCK_THRESHOLD = 5;

function getUserInitials(name) {
  return String(name || 'Admin')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

/* =========================
   AUTH SCREEN
========================= */

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  async function submit(event) {
    event.preventDefault();

    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        });

        setMode('login');

        setForm({
          ...form,
          name: '',
        });

        setMessage(
          'Account created successfully. You can now sign in.'
        );
      } else {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
          }),
        });

        if (!result?.access_token) {
          throw new Error(
            'Login did not return an access token.'
          );
        }

        localStorage.setItem(
          'access_token',
          result.access_token
        );

        const user = result.user || {};
        localStorage.setItem('current_user_name', user.name || '');
        localStorage.setItem('current_user_email', user.email || form.email.trim());
        onAuthenticated(user);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <a className="auth-brand" href="#">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span>stockroom</span>
        </a>

        <div className="auth-visual-copy">
          <p className="eyebrow">
            INVENTORY, SIMPLIFIED
          </p>

          <h1>
            Make every item
            <br />
            <em>count.</em>
          </h1>

          <p>
            Stay in control of your products, your stock,
            and your next big move.
          </p>

          <div className="auth-preview">
            <span className="preview-dot purple" />
            <span className="preview-dot orange" />
            <span className="preview-dot green" />

            <div className="preview-lines">
              <i />
              <i />
              <i />
            </div>

            <strong>Inventory overview</strong>
          </div>
        </div>

        <span className="auth-orb orb-one" />
        <span className="auth-orb orb-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>

            <span>stockroom</span>
          </div>

          <p className="eyebrow">
            {mode === 'login'
              ? 'WELCOME BACK'
              : 'GET STARTED'}
          </p>

          <h2>
            {mode === 'login'
              ? 'Sign in to your workspace'
              : 'Create your account'}
          </h2>

          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your details to continue managing inventory.'
              : 'Set up your workspace in a few simple steps.'}
          </p>

          <div
            className="auth-tabs"
            role="tablist"
          >
            <button
              className={
                mode === 'login' ? 'active' : ''
              }
              onClick={() => {
                setMode('login');
                setError('');
                setMessage('');
              }}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Sign in
            </button>

            <button
              className={
                mode === 'register' ? 'active' : ''
              }
              onClick={() => {
                setMode('register');
                setError('');
                setMessage('');
              }}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Register
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={submit}
          >
            {mode === 'register' && (
              <label>
                Full name

                <input
                  name="name"
                  value={form.name}
                  onChange={update}
                  required
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email address

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={update}
                required
                minLength={
                  mode === 'register'
                    ? 6
                    : undefined
                }
                placeholder="Enter your password"
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
              />
            </label>

            {error && (
              <p
                className="auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                className="auth-success"
                role="status"
              >
                {message}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign in'
                : 'Create account'}

              <span>→</span>
            </button>
          </form>

          <p className="auth-footer">
            {mode === 'login'
              ? 'New to stockroom? '
              : 'Already have an account? '}

            <button
              onClick={() => {
                setMode(
                  mode === 'login'
                    ? 'register'
                    : 'login'
                );

                setError('');
                setMessage('');
              }}
            >
              {mode === 'login'
                ? 'Create an account'
                : 'Sign in instead'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================
   SIDEBAR
========================= */

const can = (user, permission) =>
  user?.role === 'SUPER_ADMIN' || user?.permissions?.includes(permission);

function Sidebar({ onLogout, activePage, onNavigate, user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // const links = [
  //   ['Dashboard', '⌂'],
  //   ['Products', '▣'],
  //   ['Categories', '◇'],
  //   ['Orders', '▤'],
  //   ['Customers', '♙'],
  //   ['Inventory', '▦'],
  //   ['Payments', '▱'],
  //   ['Coupons', '▱'],
  //   ['Banners', '▧'],
  //   ['Reviews', '☆'],
  //   ['Analytics', '▥'],
  //   ['Settings', '⚙'],
  // ];

    const allLinks = [
    ['Dashboard', '⌂', 'dashboard:view'],
    ['Products', '▣', 'products:manage'],
    ['Categories', '◇', 'categories:manage'],
    ['Brands', '◈', 'products:manage'],
    ['Orders', '▤', 'orders:view'],
    ['Customers', '♙', 'customers:view'],
    ['Inventory', '▦', 'inventory:view'],
    ['Payments', '▱', 'payments:view'],
    ['Coupons', '▱', 'coupons:manage'],
    ['Banners', '▧', 'banners:manage'],
    ['Reviews', '☆', 'reviews:manage'],
    ['Analytics', '▥', 'analytics:view'],
    ['Settings', '⚙', 'SUPER_ADMIN_ONLY'],
  ];

  const links = allLinks
    .filter(([, , permission]) =>
      permission === 'SUPER_ADMIN_ONLY'
        ? user?.role === 'SUPER_ADMIN'
        : can(user, permission))
    .map(([label, icon]) => [label, icon]);
  const productPages = [
    'Products',
    'Product List',
    'Add Product',
    'Edit Product',
    'Product Images',
    'Product Details',
  ];
  const categoryPages = [
    'Categories',
    'Category List',
    'Add Category',
    'Edit Category',
  ];
  const brandPages = ['Brands'];
  const orderPages = [
    'Orders',
    'All Orders',
    'Order Details',
    'Pending Orders',
    'Processing Orders',
    'Shipped Orders',
    'Delivered Orders',
    'Cancelled Orders',
  ];
  const customerPages = [
    'Customers',
    'Customer List',
    'Customer Details',
    'Customer Order History',
  ];
  const inventoryPages = [
    'Inventory',
    'Stock',
    'Low Stock',
    'Stock History',
  ];
  const paymentPageSet = paymentPages;
  const couponPageSet = couponPages;
  const settingsPageSet = ['Settings', ...settingsSections.slice(1).map(([label]) => `${label} Settings`)];

  return (
    <aside className="sidebar dashboard-sidebar">
      <a
        className="brand"
        href="#dashboard"
        onClick={() => onNavigate('Dashboard')}
      >
        <span className="brand-mark">
          <span />
          <span />
          <span />
        </span>

        <span>stockroom</span>
      </a>

      <nav className="side-nav dashboard-nav" aria-label="Main navigation">
        {links.map(([label, icon]) => {
          const isProducts = label === 'Products';
          const isBrands = label === 'Brands';
          const isOrders = label === 'Orders';
          const isCustomers = label === 'Customers';
          const isInventory = label === 'Inventory';
          const isPayments = label === 'Payments';
          const isCoupons = label === 'Coupons';
          return (
            <div className="dashboard-nav-group" key={label}>
              <button
                className={`nav-item dashboard-nav-item ${activePage === label || (isProducts && productPages.includes(activePage)) || (isBrands && brandPages.includes(activePage)) || (label === 'Categories' && categoryPages.includes(activePage)) || (isOrders && orderPages.includes(activePage)) || (isCustomers && customerPages.includes(activePage)) || (isInventory && inventoryPages.includes(activePage)) || (isPayments && paymentPageSet.includes(activePage)) || (isCoupons && couponPageSet.includes(activePage)) || (label === 'Settings' && settingsPageSet.includes(activePage)) ? 'active' : ''}`}
                onClick={() => onNavigate(isProducts ? 'Product List' : isInventory ? 'Stock' : isOrders ? 'All Orders' : isCustomers ? 'Customer List' : isPayments ? 'All Transactions' : isCoupons ? 'Coupon List' : label)}
                type="button"
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </button>
              {isProducts && productPages.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'Product List' ? 'active' : ''} onClick={() => onNavigate('Product List')}>Product List</button>
                  <button type="button" className={activePage === 'Add Product' ? 'active' : ''} onClick={() => onNavigate('Add Product')}>Add Product</button>
                  <button type="button" className={activePage === 'Product Images' ? 'active' : ''} onClick={() => onNavigate('Product Images')}>Product Images</button>
                </div>
              )}
              {label === 'Categories' && categoryPages.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'Category List' || activePage === 'Categories' ? 'active' : ''} onClick={() => onNavigate('Category List')}>Category List</button>
                  <button type="button" className={activePage === 'Add Category' ? 'active' : ''} onClick={() => onNavigate('Add Category')}>Add Category</button>
                </div>
              )}
              {isCustomers && customerPages.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'Customer List' || activePage === 'Customers' ? 'active' : ''} onClick={() => onNavigate('Customer List')}>Customer List</button>
                  <button type="button" className={activePage === 'Customer Order History' ? 'active' : ''} onClick={() => onNavigate('Customer Order History')}>Order History</button>
                </div>
              )}
              {isInventory && inventoryPages.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'Stock' || activePage === 'Inventory' ? 'active' : ''} onClick={() => onNavigate('Stock')}>Stock</button>
                  <button type="button" className={activePage === 'Low Stock' ? 'active' : ''} onClick={() => onNavigate('Low Stock')}>Low Stock</button>
                  <button type="button" className={activePage === 'Stock History' ? 'active' : ''} onClick={() => onNavigate('Stock History')}>Stock History</button>
                </div>
              )}
              {isPayments && paymentPageSet.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'All Transactions' || activePage === 'Payments' || activePage === 'Payment Details' ? 'active' : ''} onClick={() => onNavigate('All Transactions')}>Transactions</button>
                  <button type="button" className={activePage === 'Successful Transactions' ? 'active' : ''} onClick={() => onNavigate('Successful Transactions')}>Successful</button>
                  <button type="button" className={activePage === 'Failed Transactions' ? 'active' : ''} onClick={() => onNavigate('Failed Transactions')}>Failed</button>
                  <button type="button" className={activePage === 'Refunded Transactions' ? 'active' : ''} onClick={() => onNavigate('Refunded Transactions')}>Refunded</button>
                  <button type="button" className={activePage === 'Payment Details' ? 'active' : ''} onClick={() => onNavigate('Payment Details')}>Payment Details</button>
                </div>
              )}
              {isCoupons && couponPageSet.includes(activePage) && (
                <div className="sidebar-product-subnav">
                  <button type="button" className={activePage === 'Coupons' || activePage === 'Coupon List' ? 'active' : ''} onClick={() => onNavigate('Coupon List')}>Coupons</button>
                  <button type="button" className={activePage === 'Create Coupon' ? 'active' : ''} onClick={() => onNavigate('Create Coupon')}>Create Coupon</button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="tip-card">
          <span className="tip-spark">✦</span>

          <strong>
            Smarter inventory. Happier customers.
          </strong>

          <p>
            Keep your products moving and your customers coming back.
          </p>
        </div>

        <div className="profile-menu">
          <button
            className="user-chip"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="avatar">{getUserInitials(user?.name)}</span>

            <span>
              <b>{user?.name || 'Account'}</b>
              <small>{user?.email || 'Signed in'}</small>
            </span>

            <span className="more">
              •••
            </span>
          </button>

          {menuOpen && (
            <div
              className="profile-dropdown"
              role="menu"
            >
              <button
                role="menuitem"
                onClick={onLogout}
              >
                ↪ Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* =========================
   SUMMARY
========================= */

function Summary({ products }) {
  const units = products.reduce(
    (sum, product) =>
      sum + Number(product.quantity || 0),
    0
  );

  const value = products.reduce(
    (sum, product) =>
      sum +
      Number(product.price || 0) *
        Number(product.quantity || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.quantity) <=
      LOW_STOCK_THRESHOLD
  ).length;

  const cards = [
    [
      '▦',
      'purple',
      'Total products',
      products.length,
      'catalog',
    ],
    [
      '◒',
      'orange',
      'Total units',
      units,
      'in stock',
    ],
    [
      '$',
      'green',
      'Inventory value',
      formatCurrency(value),
      'at cost',
    ],
    [
      '!',
      'red',
      'Low stock',
      lowStock,
      'needs attention',
    ],
  ];

  return (
    <section
      className="stats-grid"
      aria-label="Inventory summary"
    >
      {cards.map(
        ([
          icon,
          color,
          label,
          valueText,
          note,
        ]) => (
          <article
            className="stat-card"
            key={label}
          >
            <div
              className={`stat-icon ${color}`}
            >
              {icon}
            </div>

            <div>
              <p>{label}</p>

              <strong>
                {valueText
                  ?.toLocaleString?.() ??
                  valueText}
              </strong>
            </div>

            <span className="stat-note">
              {note}
            </span>
          </article>
        )
      )}
    </section>
  );
}

const DASHBOARD_RANGE_DAYS = { '7': 7, '30': 30, '90': 90, '365': 365 };
const DASHBOARD_STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const DASHBOARD_STATUS_COLORS = {
  pending: '#ffa42f',
  processing: '#3884f6',
  shipped: '#8b63ef',
  delivered: '#23bd8b',
  cancelled: '#ef5964',
};

function CategoryInventoryImage({ imageUrl, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  function handleError() {
    console.error('Dashboard product image failed to load:', imageUrl);
    setFailed(true);
  }

  return imageUrl && !failed
    ? <img src={imageUrl} alt={name} onError={handleError} />
    : '📦';
}

function getDashboardStatus(statuses) {
  const counts = Object.fromEntries(DASHBOARD_STATUS_ORDER.map((status) => [status, 0]));
  statuses.forEach(({ status, count }) => {
    const normalized = String(status).toLowerCase();
    if (normalized === 'payment_pending' || normalized === 'placed') {
      counts.pending += Number(count) || 0;
    } else if (normalized === 'confirmed' || normalized === 'processing') {
      counts.processing += Number(count) || 0;
    } else if (Object.hasOwn(counts, normalized)) {
      counts[normalized] += Number(count) || 0;
    }
  });
  return counts;
}

function Dashboard({
  apiRequest,
  onAddProduct,
  onViewProducts,
  onViewOrders,
  onViewCoupons,
  onViewBanners,
}) {
  const [rangeDays, setRangeDays] = useState('7');
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [orderStatuses, setOrderStatuses] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = useMemo(() => {
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(`${to}T00:00:00.000Z`);
    fromDate.setUTCDate(fromDate.getUTCDate() - DASHBOARD_RANGE_DAYS[rangeDays] + 1);
    return { from: fromDate.toISOString().slice(0, 10), to };
  }, [rangeDays]);

  useEffect(() => {
    let isCurrent = true;
    const params = new URLSearchParams(range);
    const query = `?${params.toString()}`;

    setLoading(true);
    setError('');
    setDashboard(null);
    setRevenue(null);
    setOrderStatuses(null);
    setRecentOrders([]);
    setLowStockProducts([]);
    setInventoryProducts([]);
    Promise.all([
      apiRequest(`/admin/dashboard/summary${query}`),
      apiRequest(`/admin/dashboard/revenue${query}`),
      apiRequest('/admin/dashboard/order-status'),
      apiRequest('/admin/dashboard/recent-orders?limit=5'),
      apiRequest(`/admin/dashboard/low-stock?threshold=${LOW_STOCK_THRESHOLD}&limit=5`),
      apiRequest(`/admin/dashboard/inventory?threshold=${LOW_STOCK_THRESHOLD}&limit=4`),
    ])
      .then(([summary, revenueResponse, statusResponse, ordersResponse, lowStockResponse, inventoryResponse]) => {
        if (!isCurrent) return;
        setDashboard(summary);
        setRevenue(revenueResponse);
        setOrderStatuses(statusResponse);
        setRecentOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
        setLowStockProducts(Array.isArray(lowStockResponse?.products) ? lowStockResponse.products : []);
        setInventoryProducts(Array.isArray(inventoryResponse?.products) ? inventoryResponse.products : []);
      })
      .catch((requestError) => {
        if (isCurrent) {
          console.error(requestError);
          setError(requestError.message || 'Unable to load dashboard data.');
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [apiRequest, range]);

  const statusCounts = getDashboardStatus(orderStatuses?.statuses || []);
  const totalStatuses = orderStatuses?.total || 0;
  const statusStops = [];
  let statusPercentage = 0;
  DASHBOARD_STATUS_ORDER.forEach((status) => {
    const percentage = totalStatuses ? (statusCounts[status] / totalStatuses) * 100 : 0;
    if (percentage > 0) {
      statusStops.push(`${DASHBOARD_STATUS_COLORS[status]} ${statusPercentage}% ${statusPercentage + percentage}%`);
      statusPercentage += percentage;
    }
  });
  const donutStyle = {
    background: statusPercentage
      ? `conic-gradient(${statusStops.join(', ')})`
      : '#edf0f5',
  };
  const revenueDays = revenue?.days || [];
  const maxRevenue = Math.max(0, ...revenueDays.map((day) => Number(day.revenue) || 0));
  const chartMax = maxRevenue ? Math.ceil(maxRevenue / 5 / 100) * 100 || 1 : 1;
  const chartPoints = revenueDays.map((day, index) => {
    const x = revenueDays.length <= 1 ? 310 : (index / (revenueDays.length - 1)) * 620;
    const y = 147 - ((Number(day.revenue) || 0) / chartMax) * 135;
    return [x, y];
  });
  const chartLine = chartPoints.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ');
  const chartArea = chartPoints.length
    ? `${chartLine} L620 147 L0 147 Z`
    : '';
  const chartLabels = revenueDays.length > 1
    ? Array.from({ length: Math.min(7, revenueDays.length) }, (_, index) =>
      revenueDays[Math.round(index * (revenueDays.length - 1) / (Math.min(7, revenueDays.length) - 1))].day)
    : revenueDays.map(({ day }) => day);
  const periodComparison = (current, previous) => {
    if (!previous) return current ? 'New activity vs previous period' : 'No activity in either period';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% vs previous period`;
  };
  const metrics = [
    { icon: '$', tint: 'violet', label: 'Total Revenue', value: dashboard ? formatCurrency(dashboard.totalRevenue) : '—', detail: dashboard ? periodComparison(dashboard.totalRevenue, dashboard.previousRevenue) : 'from paid orders' },
    { icon: '🛒', tint: 'blue', label: 'Orders', value: dashboard ? Number(dashboard.orderCount).toLocaleString() : '—', detail: dashboard ? `all-time · ${periodComparison(dashboard.ordersInRange, dashboard.previousOrderCount)}` : 'all-time orders' },
    { icon: '▣', tint: 'mint', label: 'Products', value: dashboard ? Number(dashboard.productCount).toLocaleString() : '—', detail: 'from database' },
    { icon: '♙', tint: 'lavender', label: 'Customers', value: dashboard ? Number(dashboard.customerCount).toLocaleString() : '—', detail: 'registered customer accounts' },
  ];

  return (
    <section className="dash-page">
      <div className="dash-heading">
        <div>
          <p className="dash-eyebrow">GOOD MORNING, ADMIN</p>
          <h1>Dashboard</h1>
          <p>Here’s what’s happening with your store today.</p>
        </div>
        <div className="dash-filters">
          <label className="dash-select">▣ &nbsp;
            <select value={rangeDays} onChange={(event) => setRangeDays(event.target.value)} aria-label="Dashboard date range">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
            <span>⌄</span>
          </label>
          <button type="button" className="dash-select" disabled title="Sales channel is not stored in the current order model">▽ &nbsp; All Channels <span>⌄</span></button>
        </div>
      </div>

      {error && (
        <div className="dash-notice" role="alert">
          Dashboard data could not be loaded: {error}
        </div>
      )}

      <div className="dash-metrics">
        {metrics.map((metric) => (
          <article className="dash-metric" key={metric.label}>
            <span className={`dash-metric-icon ${metric.tint}`}>{metric.icon}</span>
            <div className="dash-metric-copy">
              <span className="dash-metric-label">{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.trend && <b>↑ {metric.trend}</b>} {metric.trend && ' '}{metric.detail}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dash-overview-grid">
        <section className="dash-card dash-revenue">
          <header className="dash-card-header">
            <div>
              <h2>Sales &amp; Revenue</h2>
              <p>Total paid revenue from {range.from} to {range.to}</p>
            </div>
            <span className="dash-legend"><i /> Revenue</span>
          </header>
          <div className="dash-chart">
            {loading ? <p className="dash-data-message">Loading sales data…</p> : error ? <p className="dash-data-message">Sales data unavailable.</p> : revenueDays.length && maxRevenue > 0 ? <>
              <div className="dash-y-labels">{[5, 4, 3, 2, 1, 0].map((tick) => <span key={tick}>{formatCurrency(chartMax * tick / 5)}</span>)}</div>
              <svg viewBox="0 0 620 154" role="img" aria-label={`Daily paid revenue from ${range.from} to ${range.to}`}>
                <defs>
                  <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6d5dfc" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#6d5dfc" stopOpacity=".01" />
                  </linearGradient>
                </defs>
                {[12, 39, 66, 93, 120, 147].map((y) => <line key={y} x1="0" y1={y} x2="620" y2={y} className="dash-gridline" />)}
                <path d={chartArea} fill="url(#revenue-fill)" />
                <path d={chartLine} className="dash-line" />
                {chartPoints.filter((_, index) => revenueDays.length <= 30 || index % Math.ceil(revenueDays.length / 30) === 0).map(([x, y], index) => <circle key={index} cx={x} cy={y} r="3.5" className="dash-chart-dot" />)}
              </svg>
              <div className="dash-x-labels">{chartLabels.map((day) => <span key={day}>{day.slice(5)}</span>)}</div>
            </> : <p className="dash-data-message">{revenueDays.length ? 'No paid sales in this date range.' : 'No sales data is available.'}</p>}
          </div>
        </section>

        <section className="dash-card dash-order-status">
          <header className="dash-card-header">
            <div>
              <h2>Order Status</h2>
              <p>All current orders ({orderStatuses?.total ?? '—'})</p>
            </div>
          </header>
          {loading ? <p className="dash-status-message">Loading order statuses…</p> : error ? <p className="dash-status-message">Order statuses unavailable.</p> : totalStatuses ? (
            <div className="dash-status-content">
              <div className="dash-donut" style={donutStyle}><div><strong>{orderStatuses.total}</strong><span>Total orders</span></div></div>
              <ul className="dash-status-list">
                {DASHBOARD_STATUS_ORDER.map((status) => <li key={status}><i className={status} /><span>{status[0].toUpperCase() + status.slice(1)}</span><b>{Math.round(statusCounts[status] / totalStatuses * 100)}%</b><small>{statusCounts[status]}</small></li>)}
              </ul>
            </div>
          ) : <p className="dash-status-message">No orders have been placed yet.</p>}
        </section>

        <section className="dash-card dash-quick-actions">
          <header className="dash-card-header"><h2>Quick Actions</h2></header>
          <div className="dash-quick-grid">
            <button type="button" onClick={onAddProduct}><b>＋</b>Add Product</button>
            <button type="button" onClick={onViewCoupons}><b>▱</b>Create Coupon</button>
            <button type="button" onClick={onViewBanners}><b>▧</b>Add Banner</button>
            <button type="button" onClick={onViewOrders}><b>🛒</b>View Orders</button>
          </div>
        </section>
      </div>

      <div className="dash-lower-grid">
        <section className="dash-card dash-recent-orders">
          <header className="dash-card-header">
            <div><h2>Recent Orders</h2><p>Latest order activity</p></div>
            <button type="button" className="dash-link" onClick={onViewOrders}>View all orders <span>→</span></button>
          </header>
          <div className="dash-order-table-wrap">
            <table className="dash-order-table">
              <thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>PRODUCT</th><th>AMOUNT</th><th>PAYMENT STATUS</th><th>FULFILLMENT STATUS</th><th /></tr></thead>
              <tbody>{loading ? <tr><td colSpan="7" className="dash-table-message">Loading recent orders…</td></tr> : error ? <tr><td colSpan="7" className="dash-table-message">Recent orders unavailable.</td></tr> : recentOrders.length ? recentOrders.map((order) => {
                const itemsSummary = order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ');
                const paymentStatus = String(order.paymentStatus || 'pending').toLowerCase();
                const fulfillment = String(order.status || '').replaceAll('_', ' ');
                return <tr key={order.id}>
                  <td><b>#{order.orderNumber}</b></td>
                  <td><span className="dash-customer"><i>{getUserInitials(order.customerName)}</i>{order.customerName}</span></td>
                  <td><span className="dash-product-cell"><i>▣</i><span title={itemsSummary}>{itemsSummary || 'No order items'}</span></span></td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td><span className={`dash-pill ${paymentStatus}`}>● &nbsp;{paymentStatus}</span></td>
                  <td><span className={`dash-pill ${fulfillment.replaceAll(' ', '-')}`}>● &nbsp;{fulfillment}</span></td>
                  <td><button className="dash-more" type="button" aria-label={`View order ${order.orderNumber}`} onClick={onViewOrders}>···</button></td>
                </tr>;
              }) : <tr><td colSpan="7" className="dash-table-message">No orders have been placed yet.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <div className="dash-side-stack">
          <section className="dash-card dash-compact-card">
            <header className="dash-card-header">
              <h2><span className="dash-warning">▲</span> Low Stock Alerts</h2>
              <button type="button" className="dash-link" onClick={onViewProducts}>View all <span>→</span></button>
            </header>
            <ul className="dash-product-list">
              {lowStockProducts.map((product) => (
                <li key={product.id}>
                  <i className="dash-thumb"><CategoryInventoryImage imageUrl={product.imageUrl} name={product.name} /></i>
                  <span>{product.name}<small>{Number(product.quantity)} available</small></span>
                  <small className="dash-threshold">Threshold: {product.threshold}</small>
                </li>
              ))}
              {!loading && lowStockProducts.length === 0 && <li className="dash-empty-product">{error ? 'Low-stock data unavailable.' : 'No products are at or below the stock threshold.'}</li>}
              {loading && <li className="dash-empty-product">Loading inventory…</li>}
            </ul>
          </section>
          <section className="dash-card dash-compact-card dash-top-products">
            <header className="dash-card-header">
              <h2><span className="dash-bars">▥</span> Inventory Products</h2>
              <button type="button" className="dash-link" onClick={onViewProducts}>View all <span>→</span></button>
            </header>
            <ol className="dash-product-list">
              {inventoryProducts.map((product, index) => (
                <li key={product.id}>
                  <b className="dash-rank">{index + 1}</b>
                  <i className="dash-thumb"><CategoryInventoryImage imageUrl={product.imageUrl} name={product.name} /></i>
                  <span>{product.name}<small>{product.categoryName || 'Uncategorized'} · {Number(product.quantity)} in stock</small></span>
                  <b className="dash-sold-value">{formatCurrency(product.price)}</b>
                </li>
              ))}
              {!loading && inventoryProducts.length === 0 && <li className="dash-empty-product">{error ? 'Inventory data unavailable.' : 'No products in inventory.'}</li>}
              {loading && <li className="dash-empty-product">Loading inventory…</li>}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}

function UnavailablePage({ page }) {
  return (
    <section className="dash-unavailable">
      <span>▤</span>
      <h1>{page}</h1>
      <p>This section is not connected to a backend data source yet.</p>
      <small>Connect a {page.toLowerCase()} API to show live data here.</small>
    </section>
  );
}

/* =========================
   PRODUCT MODAL
========================= */

function ProductModal({
  product,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
  });

  const [imageFile, setImageFile] =
    useState(null);

  const [error, setError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const update = (event) => {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  };

  const updateImage = (event) => {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setImageFile(null);
      return;
    }

    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'webp',
    ];

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase();

    const mimeTypeAllowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type);

    if (
      !allowedExtensions.includes(
        extension
      ) ||
      (!mimeTypeAllowed && file.type)
    ) {
      setError(
        'Only JPG, JPEG, PNG, and WEBP image files are allowed.'
      );

      event.target.value = '';

      setImageFile(null);

      return;
    }

    setError('');
    setImageFile(file);
  };

  async function submit(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    if (
      !payload.name ||
      payload.price < 0 ||
      payload.quantity < 0 ||
      !Number.isFinite(payload.price) ||
      !Number.isInteger(
        payload.quantity
      )
    ) {
      setError(
        'Enter a name, a valid non-negative price, and a whole-number quantity.'
      );

      return;
    }

    setSaving(true);
    setError('');

    try {
      /*
       * IMPORTANT:
       * The backend expects:
       *
       * POST /products
       *
       * with:
       * name
       * price
       * quantity
       * image
       *
       * The old /storage/upload endpoint
       * is no longer used.
       */

      const formData = new FormData();

      formData.append(
        'name',
        payload.name
      );

      formData.append(
        'price',
        String(payload.price)
      );

      formData.append(
        'quantity',
        String(payload.quantity)
      );

      if (imageFile) {
        formData.append(
          'image',
          imageFile
        );
      }

      await apiRequest(
        product
          ? `/products/${product.id}`
          : '/products',
        {
          method: product
            ? 'PATCH'
            : 'POST',
          body: formData,
        }
      );

      await onSaved();
    } catch (requestError) {
      console.error(
        requestError
      );

      setError(
        requestError.message ||
          'Unable to save this product. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) =>
        event.target ===
          event.currentTarget &&
        onClose()
      }
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>

        <p className="eyebrow">
          {product
            ? 'UPDATE PRODUCT'
            : 'NEW PRODUCT'}
        </p>

        <h2 id="modal-title">
          {product
            ? 'Edit product'
            : 'Add a product'}
        </h2>

        <p className="modal-subtitle">
          Add a product to your inventory
          catalog.
        </p>

        <form onSubmit={submit}>
          <label>
            Product name

            <input
              name="name"
              value={form.name}
              onChange={update}
              required
              maxLength="120"
              placeholder="e.g. Wireless headphones"
              autoFocus
            />
          </label>

          <div className="form-row">
            <label>
              Price

              <input
                name="price"
                value={form.price}
                onChange={update}
                required
                min="0"
                step="0.01"
                type="number"
                placeholder="0.00"
              />
            </label>

            <label>
              Quantity

              <input
                name="quantity"
                value={form.quantity}
                onChange={update}
                required
                min="0"
                step="1"
                type="number"
                placeholder="0"
              />
            </label>
          </div>

          <label>
            Product Image

            <input
              type="file"
              name="image"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={updateImage}
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* =========================
   MAIN APP
========================= */

function App() {
  return <BrowserRouter><ApplicationContent /></BrowserRouter>;
}

function ApplicationContent() {
  if ([
    '/storefront',
    '/customer_product',
    '/customer_product/detail',
    '/customer_category',
    '/customer_cart',
    '/customer_checkout',
    '/customer_payment',
    '/customer_wishlist',
    '/customer_order',
    '/customer_order/tracking',
    '/customer_profile',
  ].includes(window.location.pathname) || window.location.pathname.startsWith('/customer_product/')) {
    return <CustomerStorefrontLayout />;
  }
  return <AdminApp />;
}

function CustomerStorefrontLayout() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [search, setSearch] = useState('');
  const currentUrl = new URL(
    `${location.pathname}${location.search}${location.hash}`,
    window.location.origin,
  );

  useEffect(() => {
    setSearch('');
  }, [location.pathname]);

  useEffect(() => {
    if (currentUrl.hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(currentUrl.hash.slice(1))?.scrollIntoView();
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search, location.hash]);

  const navigate = (destination) => {
    const nextUrl = new URL(destination, window.location.origin);
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    if (nextUrl.pathname !== currentUrl.pathname) setSearch('');
    routerNavigate(nextLocation);
  };

  const showVisualSearchResults = (results) => {
    const searchParams = new URLSearchParams(
      currentUrl.pathname === '/customer_product'
        ? window.location.search
        : '',
    );
    searchParams.set('visualSearch', '1');
    routerNavigate(`/customer_product?${searchParams.toString()}`, {
      state: {
        visualSearchResults: results.products,
        visualSearchCount: results.count,
      },
    });
  };

  const clearVisualSearch = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('visualSearch');
    const query = searchParams.toString();
    routerNavigate(`/customer_product${query ? `?${query}` : ''}`, {
      replace: true,
      state: null,
    });
  };

  const handleContentNavigation = (event) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    const destination = new URL(link.href, window.location.origin);
    if (![
      '/storefront',
      '/customer_product',
      '/customer_product/detail',
      '/customer_category',
      '/customer_cart',
      '/customer_checkout',
      '/customer_payment',
      '/customer_wishlist',
      '/customer_order',
      '/customer_order/tracking',
      '/customer_profile',
    ].includes(destination.pathname)) return;
    event.preventDefault();
    navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  };

  const activePage = currentUrl.pathname === '/customer_product'
        ? 'Products'
        : currentUrl.pathname === '/customer_category'
          ? 'Categories'
          : currentUrl.pathname === '/customer_cart'
            ? 'Cart'
            : currentUrl.pathname === '/customer_checkout' || currentUrl.pathname === '/customer_payment'
              ? 'Checkout'
          : 'Home';

  return (
    <div className="storefront" onClick={handleContentNavigation}>
      {currentUrl.pathname !== '/customer_profile' && (
          <CustomerStoreHeader
            search={search}
            onSearchChange={setSearch}
            activePage={activePage}
            onNavigate={navigate}
            onVisualSearch={showVisualSearchResults}
          />
        )}
      {currentUrl.pathname === '/customer_wishlist' ? (
        <CustomerWishlistPage key={currentUrl.pathname} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_product/detail' ? (
        <CustomerProductDetailPage key={`${currentUrl.pathname}${currentUrl.search}`} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_order' ? (
        <CustomerOrderPage key={`${currentUrl.pathname}${currentUrl.search}`} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_order/tracking' ? (
        <CustomerOrderTrackingPage key={`${currentUrl.pathname}${currentUrl.search}`} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_profile' ? (
        <CustomerProfilePage key={currentUrl.pathname} />
      ) : currentUrl.pathname === '/customer_product' ? (
        <CustomerProductPage
          key={`${currentUrl.pathname}${currentUrl.search}`}
          search={search}
          onSearchChange={setSearch}
          visualSearchResults={currentUrl.searchParams.get('visualSearch') === '1' && Array.isArray(location.state?.visualSearchResults) ? location.state.visualSearchResults : null}
          visualSearchCount={location.state?.visualSearchCount}
          onClearVisualSearch={clearVisualSearch}
        />
      ) : currentUrl.pathname === '/customer_category' ? (
        <CustomerCategoryPage key={currentUrl.pathname} search={search} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_cart' ? (
        <CustomerCartPage key={currentUrl.pathname} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_checkout' ? (
        <CustomerCheckoutPage key={currentUrl.pathname} onNavigate={navigate} />
      ) : currentUrl.pathname === '/customer_payment' ? (
        <CustomerPaymentPage key={currentUrl.pathname} onNavigate={navigate} />
      ) : currentUrl.pathname.startsWith('/customer_product/') ? (
        <CustomerProductPage
          key={`${currentUrl.pathname}${currentUrl.search}`}
          search={search}
          onSearchChange={setSearch}
        />
      ) : (
        <StorefrontPage search={search} onNavigate={navigate} />
      )}
      <CustomerSupportChatbot />
    </div>
  );
}

const isStaff = (role) => role === 'ADMIN' || role === 'SUPER_ADMIN';

function AdminApp() {
  const [authenticated, setAuthenticated] =
    useState(() =>
      Boolean(
        localStorage.getItem(
          'access_token'
        )
      )
    );

  const [user, setUser] = useState(() => ({
    name: localStorage.getItem('current_user_name') || '',
    email: localStorage.getItem('current_user_email') || '',
    role: localStorage.getItem('current_user_role') || '',
     permissions: JSON.parse(localStorage.getItem('current_user_permissions') || '[]')
  }));

  const [products, setProducts] =
    useState([]);

  const [productsMeta, setProductsMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] =
    useState('');

  const [modalProduct, setModalProduct] =
    useState(undefined);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [activePage, setActivePage] =
    useState('Dashboard');

  const [loading, setLoading] =
    useState(true);

  async function loadProducts() {
    setLoading(true);
    setStatus('');

    try {
      const response =
        await apiRequest('/products');

      setProducts(Array.isArray(response?.data) ? response.data : []);
      setProductsMeta(response?.meta || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } catch (error) {
      console.error(error);

      setProducts([]);
      setProductsMeta({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      setStatus(
        `Could not connect to the Products API. Make sure the backend is running on ${API_BASE}.`
      );
    } finally {
      setLoading(false);
    }
  }

  const searchProducts = useCallback(async (query, stock = 'all', page = 1, sortOrder = null) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (stock !== 'all') params.set('stock', stock);
    params.set('page', String(page));
    params.set('limit', '10');
    if (sortOrder) {
      params.set('sortBy', 'name');
      params.set('sortOrder', sortOrder);
    }
    const queryString = params.toString();
    const response = await apiRequest(`/products?${queryString}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      meta: response?.meta || {
        page,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (modalProduct !== undefined) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalProduct]);

  const visibleProducts = useMemo(
    () =>
      products.filter((product) =>
        String(product.name)
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  // async function saveProduct(product, payload, imageFile) {
  //   if (product) {
  //     const update = { ...payload };
  //     if (imageFile) {
  //       const upload = new FormData();
  //       upload.append('file', imageFile);
  //       const uploadResult = await apiRequest('/storage/upload', {
  //         method: 'POST',
  //         body: upload,
  //       });
  //       const imageUrl =
  //         typeof uploadResult === 'string'
  //           ? uploadResult
  //           : uploadResult?.url || uploadResult?.imageUrl;
  //       if (!imageUrl) {
  //         throw new Error('Image upload did not return an image URL.');
  //       }
  //       update.imageUrl = imageUrl;
  //     }
  //     await apiRequest(`/products/${product.id}`, {
  //       method: 'PATCH',
  //       body: JSON.stringify(update),
  //     });
  //   } else {
  //     const formData = new FormData();
  //     formData.append('name', payload.name);
  //     formData.append('price', String(payload.price));
  //     formData.append('quantity', String(payload.quantity));
  //     if (imageFile) formData.append('image', imageFile);
  //     await apiRequest('/products', {
  //       method: 'POST',
  //       body: formData,
  //     });
  //   }
  //   await loadProducts();
  //   setSelectedProduct(null);
  //   setActivePage('Product List');
  // }

  async function saveProduct(product, payload, imageFile) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('price', String(payload.price));
    formData.append('quantity', String(payload.quantity));
    formData.append('categoryId', payload.categoryId);
    formData.append('brandId', payload.brandId);
    if (imageFile) formData.append('image', imageFile);

    const savedProduct = await apiRequest(product ? `/products/${product.id}` : '/products', {
      method: product ? 'PATCH' : 'POST',
      body: formData,
    });

    await loadProducts();
    return savedProduct;
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiRequest(`/products/${deleteTarget.id}`, { method: 'DELETE' });
      await loadProducts();
      setDeleteTarget(null);
      setSelectedProduct(null);
      setActivePage('Product List');
    } catch (error) {
      console.error(error);
      setDeleteError(error.message || 'Unable to delete this product. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    await apiRequest(`/products/${product.id}`, { method: 'DELETE' });
    await loadProducts();
  }


  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token'); 
    localStorage.removeItem('current_user_name');
    localStorage.removeItem('current_user_email');
    localStorage.removeItem('current_user_role');
    localStorage.removeItem('current_user_permissions');
    setAuthenticated(false);
    setUser({ name: '', email: '', role: '', permissions: [] });
  }
  if (!authenticated) {
    return (
      <AuthPage
        onAuthenticated={(loggedInUser) => {
          const role = loggedInUser?.role || 'USER';
          setUser({
            name: loggedInUser?.name || '',
            email: loggedInUser?.email || '',
            role,
            permissions: loggedInUser?.permissions || [],
            
          });
           if (isStaff(role)) {
              setAuthenticated(true);
            } else {
            window.location.href = '/storefront';
       }}}
      />
    );
  }

  if (!isStaff(user.role)) {
    window.location.replace('/storefront');
    return null;
  }

  const productPages = [
    'Products',
    'Product List',
    'Add Product',
    'Edit Product',
    'Product Images',
    'Product Details',
  ];
  const categoryPages = [
    'Categories',
    'Category List',
    'Add Category',
    'Edit Category',
  ];
  const brandPages = ['Brands'];
  const customerPages = [
    'Customers',
    'Customer List',
    'Customer Details',
    'Customer Order History',
  ];
  const orderPages = [
    'Orders',
    'All Orders',
    'Order Details',
    'Pending Orders',
    'Processing Orders',
    'Shipped Orders',
    'Delivered Orders',
    'Cancelled Orders',
  ];
  const inventoryPages = [
    'Inventory',
    'Stock',
    'Low Stock',
    'Stock History',
  ];

  const settingsPageSet = ['Settings', ...settingsSections.slice(1).map(([label]) => `${label} Settings`)];

  if (settingsPageSet.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={handleLogout}
        />
        <main className="main-content product-content settings-content">
          <header className="topbar">
            <label className="settings-global-search"><span>⌕</span><input type="search" placeholder="Search anything..." /></label>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Admin'}⌄</span>
            </div>
          </header>
          <SettingsPage page={activePage} onNavigate={setActivePage} />
        </main>
      </div>
    );
  }

  if (activePage === 'Analytics') {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content analytics-content">
          <header className="topbar">
            <label className="analytics-global-search"><span>⌕</span><input type="search" placeholder="Search anything..." /></label>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Admin'}⌄</span>
            </div>
          </header>
          <AnalyticsPage products={products} onViewProducts={() => setActivePage('Product List')} />
        </main>
      </div>
    );
  }

  if (activePage === 'Reviews') {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content reviews-content">
          <header className="topbar">
            <label className="reviews-global-search"><span>⌕</span><input type="search" placeholder="Search reviews, products, or customers..." /></label>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Admin'}⌄</span>
            </div>
          </header>
          <ReviewsPage />
        </main>
      </div>
    );
  }

  if (couponPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content coupons-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Coupons</strong></div>
            <div className="top-actions">
              <label className="coupons-global-search"><span>⌕</span><input type="search" placeholder="Search coupons..." /></label>
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          <CouponsPage page={activePage} onNavigate={setActivePage} />
        </main>
      </div>
    );
  }

  if (paymentPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content payments-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><span>Payments</span><b>/</b><strong>{activePage === 'Payment Details' ? 'Details' : activePage === 'Payments' ? 'All Transactions' : activePage}</strong></div>
            <div className="top-actions">
              <label className="payments-global-search"><span>⌕</span><input type="search" placeholder="Search payments..." /></label>
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          <PaymentPage page={activePage} onNavigate={setActivePage} />
        </main>
      </div>
    );
  }

  if (inventoryPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content inventory-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><span>Inventory</span><b>/</b><strong>{activePage === 'Inventory' ? 'Stock' : activePage}</strong></div>
            <div className="top-actions">
              <label className="inventory-global-search"><span>⌕</span><input type="search" placeholder="Search products..." /></label>
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          <InventoryPage
            page={activePage}
            products={products}
            catalogMeta={productsMeta}
            loading={loading}
            error={status}
            onRefresh={loadProducts}
            onEdit={(product) => {
              setSelectedProduct(product);
              setActivePage(product ? 'Edit Product' : 'Add Product');
            }}
          />
        </main>
      </div>
    );
  }

  if (customerPages.includes(activePage)) {
    const customer = selectedCustomer || sampleCustomers[0];
    const openCustomerOrder = (order) => {
      setSelectedOrder({
        ...order,
        email: customer?.email || '',
        initials: customer?.initials || '',
        address: customer?.location || '',
        method: 'Visa ending in 4242',
        items: order.items || order.products.map((name) => ({ name, quantity: 1, price: order.amount / order.products.length })),
      });
      setActivePage('Order Details');
    };

    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            if (page === 'Customer List') setSelectedCustomer(null);
            setActivePage(page);
          }}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content customers-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activePage.includes('Customer') ? 'Customers' : activePage}</strong></div>
            <div className="top-actions">
              <label className="customers-global-search"><span>⌕</span><input type="search" placeholder="Search customers..." /></label>
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          {activePage === 'Customer List' || activePage === 'Customers' ? (
            <CustomerListPage onViewCustomer={(item) => {
              setSelectedCustomer(item);
              setActivePage('Customer Details');
            }} />
          ) : activePage === 'Customer Order History' ? (
            <CustomerOrderHistoryPage
              customer={customer}
              onBack={() => setActivePage('Customer Details')}
              onViewOrder={openCustomerOrder}
            />
          ) : (
            <CustomerDetailsPage
              customer={customer}
              onBack={() => setActivePage('Customer List')}
              onViewHistory={() => setActivePage('Customer Order History')}
              onViewOrder={openCustomerOrder}
            />
          )}
        </main>
      </div>
    );
  }

  if (orderPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            if (page === 'All Orders') setSelectedOrder(null);
            setActivePage(page);
          }}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content orders-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activePage === 'Order Details' ? 'Orders' : activePage}</strong></div>
            <div className="top-actions">
              <label className="orders-global-search"><span>⌕</span><input type="search" placeholder="Search orders..." /></label>
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          {activePage === 'Order Details' ? (
            <OrderDetailsPage order={selectedOrder} onBack={() => setActivePage('All Orders')} />
          ) : (
            <OrdersPage
              page={activePage}
              onViewOrder={(order) => {
                setSelectedOrder(order);
                setActivePage('Order Details');
              }}
            />
          )}
        </main>
      </div>
    );
  }

  if (categoryPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Categories</strong></div>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          <CategoriesPage page={activePage} onNavigate={setActivePage} apiRequest={apiRequest} />
        </main>
      </div>
    );
  }

  if (brandPages.includes(activePage)) {
    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content">
          <header className="topbar">
            <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Brands</strong></div>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>{getUserInitials(user.name)}</button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>
          <BrandsPage apiRequest={apiRequest} />
        </main>
      </div>
    );
  }

  if (productPages.includes(activePage)) {
    const currentProduct = selectedProduct
      ? products.find((product) => product.id === selectedProduct.id) || selectedProduct
      : null;

    return (
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            if (page === 'Product List') setSelectedProduct(null);
            setActivePage(page);
          }}
          user={user}
          onLogout={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user_name');
            localStorage.removeItem('current_user_email');
            setAuthenticated(false);
            setUser({ name: '', email: '' });
          }}
        />
        <main className="main-content product-content">
          <header className="topbar">
            <div className="breadcrumb">
              <span>Workspace</span><b>/</b><strong>{activePage}</strong>
            </div>
            <div className="top-actions">
              <button className="icon-button" aria-label="Notifications">♧<i /></button>
              <button className="avatar avatar-small" aria-label="Account" title={user.email || user.name}>
                {getUserInitials(user.name)}
              </button>
              <span className="product-header-name">{user.name || 'Account'}⌄</span>
            </div>
          </header>

          {(activePage === 'Products' || activePage === 'Inventory' || activePage === 'Product List') && (
            <ProductListPage
              products={products}
              catalogMeta={productsMeta}
              loading={loading}
              error={status}
              onAdd={() => {
                setSelectedProduct(null);
                setActivePage('Add Product');
              }}
              onEdit={(product) => {
                setSelectedProduct(product);
                setActivePage('Edit Product');
              }}
              onView={(product) => {
                setSelectedProduct(product);
                setActivePage('Product Details');
              }}
              onDelete={(product) => {
                setDeleteError('');
                setDeleteTarget(product);
              }}
              onRefresh={loadProducts}
              onSearchProducts={searchProducts}
            />
          )}

          {(activePage === 'Add Product' || activePage === 'Edit Product') && (
            <ProductFormPage
              key={`${activePage}-${currentProduct?.id || 'new'}`}
              product={activePage === 'Edit Product' ? currentProduct : null}
              apiRequest={apiRequest}
              onCancel={() => setActivePage('Product List')}
              onEditCreated={(product) => {
                setSelectedProduct(product);
                setActivePage('Edit Product');
              }}
              onSave={(payload, imageFile) => saveProduct(
                activePage === 'Edit Product' ? currentProduct : null,
                payload,
                imageFile,
              )}
            />
          )}

          {activePage === 'Product Images' && (
            <ProductGalleryPage
              products={products}
              onOpenProduct={(product) => {
                setSelectedProduct(product);
                setActivePage('Product Details');
              }}
            />
          )}

          {activePage === 'Product Details' && (
            <ProductDetailPage
              product={currentProduct}
              onBack={() => setActivePage('Product List')}
              onEdit={(product) => {
                setSelectedProduct(product);
                setActivePage('Edit Product');
              }}
            />
          )}
        </main>

        {deleteTarget && (
          <div className="product-dialog-backdrop" role="presentation">
            <section className="product-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
              <button className="product-dialog-close" type="button" onClick={() => setDeleteTarget(null)} aria-label="Close">×</button>
              <span className="product-delete-icon">!</span>
              <h2 id="delete-product-title">Delete Product</h2>
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="product-delete-summary">
                <span className="product-row-image">{deleteTarget.imageUrl ? <img src={deleteTarget.imageUrl} alt="" /> : '📦'}</span>
                <span><strong>{deleteTarget.name}</strong><small>Product ID: {deleteTarget.id}</small></span>
                <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(deleteTarget.price) || 0)}</b>
              </div>
              {deleteError && <p className="product-api-error" role="alert">{deleteError}</p>}
              <div className="product-form-actions">
                <button className="product-secondary-button" type="button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="product-danger-button" type="button" disabled={deleting} onClick={confirmDeleteProduct}>{deleting ? 'Deleting…' : 'Delete Product'}</button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={() => {
          localStorage.removeItem(
            'access_token'
          );
          localStorage.removeItem('current_user_name');
          localStorage.removeItem('current_user_email');

          setAuthenticated(false);
          setUser({ name: '', email: '' });
        }}
      />

      <main
        className={`main-content ${activePage === 'Dashboard' ? 'dashboard-content' : ''}`}
        id="inventory"
      >
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{activePage}</strong>
          </div>

          <div className={`top-actions ${activePage === 'Dashboard' ? 'dash-top-actions' : ''}`}>
            {activePage === 'Dashboard' && (
              <label className="dash-global-search">
                <span>⌕</span>
                <input type="search" placeholder="Search products, orders, customers..." />
              </label>
            )}
            <button
              className="icon-button"
              aria-label="Notifications"
            >
              ♧
              <i />
            </button>

            <button
              className="avatar avatar-small"
              aria-label="Account"
              title={user.email || user.name || 'Account'}
            >
              {getUserInitials(user.name)}
            </button>
            {activePage === 'Dashboard' && (
              <span className="dash-admin-label" title={user.email}>
                {user.name || 'Account'}⌄
              </span>
            )}
          </div>
        </header>

        {activePage === 'Dashboard' ? (
          <Dashboard
            apiRequest={apiRequest}
            onAddProduct={() => {
              setSelectedProduct(null);
              setActivePage('Add Product');
            }}
            onViewProducts={() => setActivePage('Product List')}
            onViewOrders={() => setActivePage('Orders')}
            onViewCoupons={() => setActivePage('Coupons')}
            onViewBanners={() => setActivePage('Banners')}
          />
        ) : activePage === 'Products' || activePage === 'Inventory' ? (
          <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">
              PRODUCT CATALOG
            </p>

            <h1>
              Inventory overview
            </h1>

            <p className="subtitle">
              Manage your products and keep
              an eye on what needs attention.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setModalProduct(null)
            }
          >
            <span>+</span>
            Add product
          </button>
        </section>

        <Summary
          products={products}
        />

        <section className="inventory-panel">
          <div className="panel-header">
            <div>
              <h2>
                All products
              </h2>

              <span className="result-count">
                {loading
                  ? 'Loading products...'
                  : `${visibleProducts.length} ${
                      visibleProducts.length ===
                      1
                        ? 'product'
                        : 'products'
                    }`}
              </span>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <span>⌕</span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products..."
                />
              </label>

              <button
                className="filter-button"
                onClick={loadProducts}
                disabled={loading}
              >
                ↻
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {status && (
            <div
              className="status-message"
              role="status"
            >
              {status}
            </div>
          )}

          {visibleProducts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>PRICE</th>
                    <th>QUANTITY</th>
                    <th>STOCK STATUS</th>
                    <th>
                      <span className="sr-only">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProducts.map(
                    (product) => {
                      const quantity =
                        Number(
                          product.quantity
                        );

                      const statusClass =
                        quantity === 0
                          ? 'out-stock'
                          : quantity <=
                            LOW_STOCK_THRESHOLD
                          ? 'low-stock-badge'
                          : 'in-stock';

                      const label =
                        quantity === 0
                          ? 'Out of stock'
                          : quantity <=
                            LOW_STOCK_THRESHOLD
                          ? 'Low stock'
                          : 'In stock';

                      return (
                        <tr
                          key={product.id}
                        >
                          <td>
                            <div className="product-details">
                              {product.imageUrl && (
                                <img
                                  className="product-image"
                                  src={
                                    product.imageUrl
                                  }
                                  alt=""
                                />
                              )}

                              <span>
                                <span className="product-name">
                                  {
                                    product.name
                                  }
                                </span>

                                <span className="product-id">
                                  ID #
                                  {
                                    product.id
                                  }
                                </span>
                              </span>
                            </div>
                          </td>

                          <td>
                            {formatCurrency(
                              product.price
                            )}
                          </td>

                          <td>
                            {quantity.toLocaleString()}
                          </td>

                          <td>
                            <span
                              className={`badge ${statusClass}`}
                            >
                              {label}
                            </span>
                          </td>

                          <td>
                            <div className="actions">
                              <button
                                className="action-button"
                                onClick={() =>
                                  setModalProduct(
                                    product
                                  )
                                }
                                aria-label={`Edit ${product.name}`}
                              >
                                ✎
                              </button>

                              <button
                                className="action-button delete"
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                                aria-label={`Delete ${product.name}`}
                              >
                                ⌫
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                ▦
              </div>

              <h3>
                {status
                  ? 'Products unavailable'
                  : 'No products found'}
              </h3>

              <p>
                {status
                  ? 'Start the NestJS API and refresh this page.'
                  : 'Try another search or add your first product.'}
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setModalProduct(null)
                }
              >
                Add product
              </button>
            </div>
          )}
        </section>

        <p className="footer-note">
          Stockroom inventory
          <span>•</span>
          Connected to Products API
        </p>
          </>
        ) : (
          <UnavailablePage page={activePage} />
        )}
      </main>

      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          onClose={() =>
            setModalProduct(undefined)
          }
          onSaved={async () => {
            setModalProduct(undefined);
            await loadProducts();
          }}
        />
      )}
    </div>
  );
}

export default App;
