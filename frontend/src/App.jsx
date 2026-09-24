import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://aswani-product-api-fghbcjgbf4hyhaa3.indiasouthcentral-01.azurewebsites.net');
const LOW_STOCK_THRESHOLD = 5;

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(Number(value) || 0);

async function apiRequest(path, options = {}) {
  const headers = options.body instanceof FormData
    ? options.headers
    : { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
        });
        setMode('login');
        setForm({ ...form, name: '' });
        setMessage('Account created successfully. You can now sign in.');
      } else {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        if (!result?.access_token) throw new Error('Login did not return an access token.');
        localStorage.setItem('access_token', result.access_token);
        onAuthenticated();
      }
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="auth-shell"><section className="auth-visual"><a className="auth-brand" href="#"><span className="brand-mark"><span /><span /><span /></span><span>stockroom</span></a><div className="auth-visual-copy"><p className="eyebrow">INVENTORY, SIMPLIFIED</p><h1>Make every item<br /><em>count.</em></h1><p>Stay in control of your products, your stock, and your next big move.</p><div className="auth-preview"><span className="preview-dot purple" /><span className="preview-dot orange" /><span className="preview-dot green" /><div className="preview-lines"><i /><i /><i /></div><strong>Inventory overview</strong></div></div><span className="auth-orb orb-one" /><span className="auth-orb orb-two" /></section><section className="auth-panel"><div className="auth-card"><div className="auth-mobile-brand"><span className="brand-mark"><span /><span /><span /></span><span>stockroom</span></div><p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</p><h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Enter your details to continue managing inventory.' : 'Set up your workspace in a few simple steps.'}</p><div className="auth-tabs" role="tablist"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage(''); }} role="tab" aria-selected={mode === 'login'}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setMessage(''); }} role="tab" aria-selected={mode === 'register'}>Register</button></div><form className="auth-form" onSubmit={submit}>{mode === 'register' && <label>Full name<input name="name" value={form.name} onChange={update} required placeholder="Your name" autoComplete="name" /></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={update} required placeholder="you@example.com" autoComplete="email" /></label><label>Password<input name="password" type="password" value={form.password} onChange={update} required minLength={mode === 'register' ? 6 : undefined} placeholder="Enter your password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}<button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}<span>→</span></button></form><p className="auth-footer">{mode === 'login' ? 'New to stockroom? ' : 'Already have an account? '}<button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in instead'}</button></p></div></section></main>;
}

function Sidebar({ onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <aside className="sidebar">
    <a className="brand" href="#"><span className="brand-mark"><span /><span /><span /></span><span>stockroom</span></a>
    <nav className="side-nav" aria-label="Main navigation"><a className="nav-item active" href="#inventory"><span className="nav-icon">▦</span>Inventory</a><a className="nav-item" href="#reports"><span className="nav-icon">⌁</span>Reports</a></nav>
    <div className="sidebar-bottom"><div className="tip-card"><span className="tip-spark">✦</span><strong>Keep your stock moving</strong><p>Review low-stock products daily to stay ahead.</p></div><div className="profile-menu"><button className="user-chip" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-haspopup="menu"><span className="avatar">A</span><span><b>Admin</b><small>Workspace owner</small></span><span className="more">•••</span></button>{menuOpen && <div className="profile-dropdown" role="menu"><button role="menuitem" onClick={() => setMenuOpen(false)}>⚙ Settings</button><button role="menuitem" onClick={onLogout}>↪ Log out</button></div>}</div></div>
  </aside>;
}

function Summary({ products }) {
  const units = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const value = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0), 0);
  const lowStock = products.filter((product) => Number(product.quantity) <= LOW_STOCK_THRESHOLD).length;
  const cards = [['▦', 'purple', 'Total products', products.length, 'catalog'], ['◒', 'orange', 'Total units', units, 'in stock'], ['$', 'green', 'Inventory value', formatCurrency(value), 'at cost'], ['!', 'red', 'Low stock', lowStock, 'needs attention']];
  return <section className="stats-grid" aria-label="Inventory summary">{cards.map(([icon, color, label, valueText, note]) => <article className="stat-card" key={label}><div className={`stat-icon ${color}`}>{icon}</div><div><p>{label}</p><strong>{valueText.toLocaleString?.() ?? valueText}</strong></div><span className="stat-note">{note}</span></article>)}</section>;
}

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({ name: product?.name || '', price: product?.price ?? '', quantity: product?.quantity ?? '' });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const updateImage = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImageFile(null);
      return;
    }
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeAllowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!allowedExtensions.includes(extension) || (!mimeTypeAllowed && file.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      event.target.value = '';
      setImageFile(null);
      return;
    }
    setError('');
    setImageFile(file);
  };
  async function submit(event) {
    event.preventDefault();
    const payload = { name: form.name.trim(), price: Number(form.price), quantity: Number(form.quantity) };
    if (!payload.name || payload.price < 0 || payload.quantity < 0 || !Number.isFinite(payload.price) || !Number.isInteger(payload.quantity)) {
      setError('Enter a name, a valid non-negative price, and a whole-number quantity.'); return;
    }
    if (imageFile) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const extension = imageFile.name.split('.').pop()?.toLowerCase();
      const mimeTypeAllowed = ['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type);
      if (!allowedExtensions.includes(extension) || (!mimeTypeAllowed && imageFile.type)) {
        setError('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
        return;
      }
    }
    setSaving(true); setError('');
    try {
      let imageUrl;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadResult = await apiRequest('/storage/upload', {
          method: 'POST',
          body: uploadData,
        });
        imageUrl = typeof uploadResult === 'string'
          ? uploadResult
          : uploadResult?.imageUrl || uploadResult?.url || uploadResult?.reference;
        if (!imageUrl) throw new Error('The image upload did not return an image reference.');
      }
      const productPayload = imageUrl ? { ...payload, imageUrl } : payload;
      await apiRequest(product ? `/products/${product.id}` : '/products', { method: product ? 'PATCH' : 'POST', body: JSON.stringify(productPayload) });
      await onSaved();
    } catch { setError('Unable to save this product. Please try again.'); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close-button" onClick={onClose} aria-label="Close dialog">×</button><p className="eyebrow">{product ? 'UPDATE PRODUCT' : 'NEW PRODUCT'}</p><h2 id="modal-title">{product ? 'Edit product' : 'Add a product'}</h2><p className="modal-subtitle">Add a product to your inventory catalog.</p><form onSubmit={submit}><label>Product name<input name="name" value={form.name} onChange={update} required maxLength="120" placeholder="e.g. Wireless headphones" autoFocus /></label><div className="form-row"><label>Price<input name="price" value={form.price} onChange={update} required min="0" step="0.01" type="number" placeholder="0.00" /></label><label>Quantity<input name="quantity" value={form.quantity} onChange={update} required min="0" step="1" type="number" placeholder="0" /></label></div><label>Product Image<input type="file" name="image" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={updateImage} /></label><p className="form-error">{error}</p><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button></div></form></section></div>;
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState(undefined);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  async function loadProducts() {
    setLoading(true); setStatus('');
    try { const result = await apiRequest('/products'); setProducts(Array.isArray(result) ? result : []); }
    catch { setProducts([]); setStatus(`Could not connect to the Products API. Make sure the backend is running on ${API_BASE}.`); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { if (modalProduct !== undefined) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, [modalProduct]);
  const visibleProducts = useMemo(() => products.filter((product) => String(product.name).toLowerCase().includes(search.toLowerCase())), [products, search]);
  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try { await apiRequest(`/products/${product.id}`, { method: 'DELETE' }); await loadProducts(); } catch { setStatus('Unable to delete this product. Please try again.'); }
  }
  if (!authenticated) return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />;
  return <div className="app-shell"><Sidebar onLogout={() => { localStorage.removeItem('access_token'); setAuthenticated(false); }} /><main className="main-content" id="inventory"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Inventory</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><button className="avatar avatar-small" aria-label="Account">A</button></div></header><section className="page-heading"><div><p className="eyebrow">PRODUCT CATALOG</p><h1>Inventory overview</h1><p className="subtitle">Manage your products and keep an eye on what needs attention.</p></div><button className="primary-button" onClick={() => setModalProduct(null)}><span>+</span> Add product</button></section><Summary products={products} /><section className="inventory-panel"><div className="panel-header"><div><h2>All products</h2><span className="result-count">{loading ? 'Loading products...' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}`}</span></div><div className="toolbar"><label className="search-box"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /></label><button className="filter-button" onClick={loadProducts} disabled={loading}>↻ <span>Refresh</span></button></div></div>{status && <div className="status-message" role="status">{status}</div>}{visibleProducts.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>QUANTITY</th><th>STOCK STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleProducts.map((product) => { const quantity = Number(product.quantity); const statusClass = quantity === 0 ? 'out-stock' : quantity <= LOW_STOCK_THRESHOLD ? 'low-stock-badge' : 'in-stock'; const label = quantity === 0 ? 'Out of stock' : quantity <= LOW_STOCK_THRESHOLD ? 'Low stock' : 'In stock'; return <tr key={product.id}><td><div className="product-details">{product.imageUrl && <img className="product-image" src={product.imageUrl} alt="" />}<span><span className="product-name">{product.name}</span><span className="product-id">ID #{product.id}</span></span></div></td><td>{formatCurrency(product.price)}</td><td>{quantity.toLocaleString()}</td><td><span className={`badge ${statusClass}`}>{label}</span></td><td><div className="actions"><button className="action-button" onClick={() => setModalProduct(product)} aria-label={`Edit ${product.name}`}>✎</button><button className="action-button delete" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}>⌫</button></div></td></tr>; })}</tbody></table></div> : <div className="empty-state"><div className="empty-icon">▦</div><h3>{status ? 'Products unavailable' : 'No products found'}</h3><p>{status ? 'Start the NestJS API and refresh this page.' : 'Try another search or add your first product.'}</p><button className="secondary-button" onClick={() => setModalProduct(null)}>{status ? 'Add product' : 'Add product'}</button></div>}</section><p className="footer-note">Stockroom inventory <span>•</span> Connected to Products API</p></main>{modalProduct !== undefined && <ProductModal product={modalProduct} onClose={() => setModalProduct(undefined)} onSaved={async () => { setModalProduct(undefined); await loadProducts(); }} />}</div>;
}

export default App;
