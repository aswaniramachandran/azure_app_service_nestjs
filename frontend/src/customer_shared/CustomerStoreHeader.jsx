import { useEffect, useRef, useState } from 'react';
import { fetchCustomerCart } from '../customer_cart/customerCartApi.js';
import {
  fetchCustomerWishlist,
} from '../customer_wishlist/customerWishlistApi.js';
import { CartIcon, HeartIcon, UserAvatar } from './CustomerHeaderIcons.jsx';
import { searchProductsByImage, validateVisualSearchImage } from '../customer_product/visualSearchApi.js';
import './visual-search-entry.css';

function Brand() {
  return <a className="store-brand" href="/storefront" aria-label="Stockroom home"><span className="store-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

export default function CustomerStoreHeader({ search, onSearchChange, activePage, onNavigate, onVisualSearch }) {
  const visualSearchInput = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => ({
    accessToken: localStorage.getItem('access_token'),
    name: localStorage.getItem('current_user_name') || '',
    email: localStorage.getItem('current_user_email') || '',
    role: localStorage.getItem('current_user_role') || '',
  }));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [visualSearchBusy, setVisualSearchBusy] = useState(false);
  const [visualSearchError, setVisualSearchError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCart()
      .then((cart) => { if (isCurrent) setCartCount(Number(cart.totalItems) || 0); })
      .catch(() => { if (isCurrent) setCartCount(0); });
    if (localStorage.getItem('access_token') || localStorage.getItem('refresh_token')) {
      fetchCustomerWishlist()
        .then((wishlist) => {
          if (isCurrent) setWishlistCount(Number(wishlist.totalItems) || wishlist.items.length);
        })
        .catch((requestError) => {
          if (isCurrent) console.error('Could not load the customer wishlist count.', requestError);
        });
    }
    const refreshCartCount = (event) => {
      setCartCount(Number(event.detail?.totalItems) || 0);
    };
    const refreshWishlistCount = (event) => {
      setWishlistCount(Number(event.detail?.totalItems) || 0);
    };
    window.addEventListener('customer-cart-updated', refreshCartCount);
    window.addEventListener('customer-wishlist-updated', refreshWishlistCount);
    return () => {
      isCurrent = false;
      window.removeEventListener('customer-cart-updated', refreshCartCount);
      window.removeEventListener('customer-wishlist-updated', refreshWishlistCount);
    };
  }, []);

  const logout = () => {
    ['access_token', 'refresh_token', 'current_user_name', 'current_user_email', 'current_user_role', 'current_user_permissions'].forEach((key) => localStorage.removeItem(key));
    setCurrentUser({ accessToken: null, name: '', email: '', role: '' });
    setUserMenuOpen(false);
    window.location.assign('/');
  };

  const navigate = (event, destination) => {
    event.preventDefault();
    onNavigate(destination);
  };

  const handleVisualSearchFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateVisualSearchImage(file);
    if (validationError) {
      setVisualSearchError(validationError);
      return;
    }

    setVisualSearchError('');
    setVisualSearchBusy(true);
    try {
      const results = await searchProductsByImage(file);
      onVisualSearch(results);
    } catch (requestError) {
      setVisualSearchError(requestError.message || 'Image search failed. Please try again.');
    } finally {
      setVisualSearchBusy(false);
    }
  };

  return <>
    <div className="store-announce"><span>Free shipping on orders over $50</span><span><a href="/customer_order">Track Your Order</a> <b>·</b> Help Center</span></div>
    <header className="store-header">
      <a className="store-brand" href="/storefront" aria-label="Stockroom home" onClick={(event) => navigate(event, '/storefront')}><span className="store-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>
      <nav className="store-main-nav" aria-label="Store navigation">
        <a className={activePage === 'Home' ? 'selected' : ''} href="/storefront" onClick={(event) => navigate(event, '/storefront')}>Home</a>
        <a className={activePage === 'Products' ? 'selected' : ''} href="/customer_product" onClick={(event) => navigate(event, '/customer_product')}>Products</a>
        <a className={activePage === 'Categories' ? 'selected' : ''} href="/customer_category" onClick={(event) => navigate(event, '/customer_category')}>Categories</a>
      </nav>
      <label className="store-search"><span>⌕</span><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search for products, brands..." aria-label="Search products" /><kbd>⌘ K</kbd></label>
      <button className="store-image-search-button" type="button" onClick={() => visualSearchInput.current?.click()} disabled={visualSearchBusy} aria-label="Search by image">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h3l1.5-2h7L17 7.5h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" /><circle cx="12" cy="13" r="3.5" /></svg>
        <span>{visualSearchBusy ? 'Searching…' : 'Search by Image'}</span>
      </button>
      <input ref={visualSearchInput} className="store-image-search-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a JPEG, PNG, or WEBP image" onChange={handleVisualSearchFile} />
      {visualSearchError && <span className="store-image-search-error" role="alert">{visualSearchError}</span>}
      <div className="store-header-actions">
        <a className="store-wishlist-link" href="/customer_wishlist" aria-label={`Wishlist, ${wishlistCount} items`}><HeartIcon /><i>{wishlistCount}</i></a>
        <a href="/customer_cart" className="store-cart" aria-label={`Shopping cart, ${cartCount} items`}><CartIcon /><i>{cartCount}</i></a>
        {currentUser.accessToken ? <div className="store-user-menu"><button className="store-signin" type="button" aria-expanded={userMenuOpen} aria-haspopup="menu" onClick={() => setUserMenuOpen((open) => !open)}><UserAvatar name={currentUser.name || currentUser.email || 'Account'} />{currentUser.name || currentUser.email || 'Account'} <span aria-hidden="true">⌄</span></button>{userMenuOpen && <div className="store-user-dropdown" role="menu"><a href="/customer_profile" role="menuitem">My Profile</a><a href="/customer_order" role="menuitem">My Orders</a>{currentUser.role === 'ADMIN' && <a href="/" role="menuitem">Admin Dashboard</a>}<button type="button" role="menuitem" onClick={logout}>Log out</button></div>}</div> : <a className="store-signin" href="/">Login / Register</a>}
      </div>
    </header>
  </>;
}
