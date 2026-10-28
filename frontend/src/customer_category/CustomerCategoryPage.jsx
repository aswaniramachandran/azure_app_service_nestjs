import { useEffect, useMemo, useState } from 'react';
import { fetchCustomerCategories } from '../customer_product/customerCatalogApi.js';
import './customer-category.css';

const cardColors = ['violet', 'pink', 'mint', 'blue', 'orange', 'purple', 'cyan', 'rose'];

function Brand() {
  return <a className="cc-brand" href="/storefront" aria-label="Stockroom home"><span className="cc-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function CategoryCardImage({ imageUrl, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  function handleImageError() {
    console.error('Category image failed to load:', imageUrl);
    setFailed(true);
  }

  return imageUrl && !failed
    ? <img src={imageUrl} alt={name} loading="lazy" onError={handleImageError} />
    : <span className="cc-category-image-placeholder" aria-hidden="true">▧</span>;
}

export default function CustomerCategoryPage({ search = '', onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCategories()
      .then((records) => {
        if (isCurrent) setCategories(records);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setCategories([]);
          setError(requestError.message || 'Unable to load categories. Please try again.');
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase())),
    [categories, search],
  );

  return <div className="customer-category">
    <main className="cc-main">
      <section className="cc-hero">
        <div><span>SHOP BY CATEGORY</span><h1>Find What You Need</h1><p>Explore our wide range of electronics and accessories<br />for every lifestyle and passion.</p></div>
        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=760&q=85" alt="" />
      </section>
      <section className="cc-categories">
        <header className="cc-section-heading"><div><h2>All Categories</h2><p>Browse through our product categories and find your perfect match.</p></div><span>Total Categories <b>{visibleCategories.length}</b></span></header>
        {loading ? <p className="cc-empty" role="status">Loading categories…</p> : error ? <p className="cc-empty" role="alert">Categories could not be loaded: {error}</p> : visibleCategories.length ? <div className="cc-grid">{visibleCategories.map((category, index) => <a className={`cc-card ${cardColors[index % cardColors.length]}`} href={`/customer_product?categoryId=${encodeURIComponent(category.id)}`} onClick={(event) => { event.preventDefault(); onNavigate(`/customer_product?categoryId=${encodeURIComponent(category.id)}`); }} key={category.id}>
          <div className="cc-card-image"><CategoryCardImage imageUrl={category.imageUrl} name={category.name} /></div>
          <div className="cc-card-info"><span className="cc-category-icon" aria-hidden="true">▧</span><span className="cc-category-copy"><strong>{category.name}</strong><small>{(category.productCount ?? category.count) != null ? `${category.productCount ?? category.count} Products` : 'Browse products'}</small></span><span className="cc-arrow">→</span></div>
        </a>)}</div> : <p className="cc-empty">{search ? `No categories match “${search}”.` : 'No categories are available.'}</p>}
      </section>
    </main>
    <footer className="cc-footer"><div className="cc-footer-inner"><div className="cc-footer-brand"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="cc-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Pinterest">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="cc-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="cc-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
