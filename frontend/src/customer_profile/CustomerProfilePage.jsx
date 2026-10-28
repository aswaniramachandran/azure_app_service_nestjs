import { useEffect, useState } from 'react';
import { fetchCustomerCart } from '../customer_cart/customerCartApi.js';
import { useCustomerWishlist } from '../customer_wishlist/useCustomerWishlist.js';
import { CartIcon, UserAvatar } from '../customer_shared/CustomerHeaderIcons.jsx';
import './customer-profile.css';

const profileStorageKey = 'stockroom_customer_profile';
const initialProfile = {
  fullName: localStorage.getItem('current_user_name') || 'John Doe',
  email: localStorage.getItem('current_user_email') || 'john@example.com',
  phone: '+91 98765 43210',
  gender: 'Male',
  birthDate: '15 Jan 1995',
  language: 'English',
  location: 'Bangalore, India',
  memberSince: 'Apr 2025',
  photo: '',
};

function readProfile() {
  try {
    const saved = localStorage.getItem(profileStorageKey);
    return saved ? { ...initialProfile, ...JSON.parse(saved) } : initialProfile;
  } catch (error) {
    console.error('Could not read the saved customer profile.', error);
    return initialProfile;
  }
}

function Brand() {
  return <a className="cpr-brand" href="/storefront" aria-label="Stockroom home"><span className="cpr-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function Footer() {
  return <footer className="cpr-footer"><div className="cpr-footer-main"><div className="cpr-footer-about"><Brand /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="cpr-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="Twitter">𝕏</a><a href="#footer" aria-label="YouTube">▶</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/customer_profile">My Profile</a><a href="/customer_order">My Orders</a><a href="/customer_wishlist">Wishlist</a><a href="/customer_order">Track Order</a><a href="/customer_profile">Addresses</a></div><div><h2>Payment Methods</h2><div className="cpr-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="cpr-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState(readProfile);
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const { items: wishlistItems, error: wishlistError } = useCustomerWishlist();
  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCart()
      .then((cart) => { if (isCurrent) setCartCount(Number(cart.totalItems) || 0); })
      .catch(() => { if (isCurrent) setCartCount(0); });
    const updateCount = (event) => setCartCount(Number(event.detail?.totalItems) || 0);
    window.addEventListener('customer-cart-updated', updateCount);
    return () => {
      isCurrent = false;
      window.removeEventListener('customer-cart-updated', updateCount);
    };
  }, []);
  const userName = profile.fullName || 'John Doe';
  const wishlistCount = wishlistItems.length;

  const saveProfile = (event) => {
    event.preventDefault();
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    localStorage.setItem('current_user_name', profile.fullName);
    localStorage.setItem('current_user_email', profile.email);
    setEditing(false);
    setMessage('Your profile has been updated.');
  };

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Choose an image file for your profile photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile((current) => ({ ...current, photo: String(reader.result) }));
    reader.onerror = () => setMessage('Could not load the selected profile photo.');
    reader.readAsDataURL(file);
  };

  const logout = () => {
    ['access_token', 'current_user_name', 'current_user_email', 'current_user_role'].forEach((key) => localStorage.removeItem(key));
    window.location.assign('/');
  };

  const changePassword = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('newPassword') !== data.get('confirmPassword')) {
      setPasswordMessage('The new password and confirmation do not match.');
      return;
    }
    setPasswordMessage('Password changes are not connected to an authentication service yet.');
  };

  return <div className="customer-profile">
    <header className="cpr-header"><Brand /><nav className="cpr-nav" aria-label="Store navigation"><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_category">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About</a></nav><label className="cpr-search"><span>⌕</span><input placeholder="Search products, brands and more..." aria-label="Search products" /><button type="button" aria-label="Search">⌕</button></label><div className="cpr-header-actions"><a href="/customer_wishlist" aria-label={`Wishlist, ${wishlistCount} items`}>♡<i>{wishlistCount}</i></a><a className="cpr-cart-link" href="/customer_cart" aria-label={`Shopping cart, ${cartCount} items`}><CartIcon /><i>{cartCount}</i></a><div className="cpr-account"><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}><UserAvatar name={userName} />{userName}<span>⌄</span></button>{menuOpen && <div className="cpr-account-menu"><a href="/customer_profile">My Profile</a><a href="/customer_order">My Orders</a><button type="button" onClick={logout}>Log out</button></div>}</div></div></header>
    <main className="cpr-main">
      <section className="cpr-hero"><div><span>MY ACCOUNT</span><h1>Manage Your Account</h1><p>Update your personal information and preferences.</p></div><div className="cpr-hero-art" aria-hidden="true"><span>♙</span><b>⚙</b></div></section>
      {message && <p className="cpr-message" role="status">{message}</p>}
      {wishlistError && <p className="cpr-message" role="alert">{wishlistError}</p>}
      <div className="cpr-layout">
        <section className="cpr-profile-card">
          <header className="cpr-section-heading"><h2>Profile Information</h2><button type="button" onClick={() => { setEditing((open) => !open); setMessage(''); }}>{editing ? 'Cancel' : '✎ Edit Profile'}</button></header>
          <div className="cpr-identity"><div className="cpr-avatar-wrap"><img src={profile.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=85'} alt={`${userName} profile`} /><label className="cpr-photo-edit" aria-label="Change profile photo">◎<input type="file" accept="image/*" onChange={selectPhoto} /></label></div><div className="cpr-identity-info"><h3>{userName}</h3><p>{profile.email}</p><span className="cpr-verified">● &nbsp; Verified Account</span></div></div>
          <div className="cpr-quick-info"><div><span>♧</span><p><small>Phone</small><b>{profile.phone}</b></p></div><div><span>▣</span><p><small>Member Since</small><b>{profile.memberSince}</b></p></div><div><span>⌖</span><p><small>Location</small><b>{profile.location}</b></p></div></div>
          {editing ? <form className="cpr-edit-form" onSubmit={saveProfile}><label>Full Name<input required value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></label><label>Email Address<input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label><label>Phone Number<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><label>Gender<input value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })} /></label><label>Date of Birth<input value={profile.birthDate} onChange={(event) => setProfile({ ...profile, birthDate: event.target.value })} /></label><label>Preferred Language<input value={profile.language} onChange={(event) => setProfile({ ...profile, language: event.target.value })} /></label><button className="cpr-primary-button" type="submit">Save Changes</button></form> : <><section className="cpr-personal-details"><h2>Personal Details</h2><dl><div><dt>Full Name</dt><dd>{profile.fullName}</dd></div><div><dt>Gender</dt><dd>{profile.gender}</dd></div><div><dt>Email Address</dt><dd>{profile.email}</dd></div><div><dt>Date of Birth</dt><dd>{profile.birthDate}</dd></div><div><dt>Phone Number</dt><dd>{profile.phone}</dd></div><div><dt>Preferred Language</dt><dd>{profile.language}</dd></div></dl></section><section className="cpr-password-row"><span>♙</span><div><b>Change Password</b><small>Keep your account secure with a strong password.</small></div><button type="button" onClick={() => { setPasswordOpen((open) => !open); setPasswordMessage(''); }}>{passwordOpen ? 'Cancel' : 'Change Password'} <span>›</span></button></section>{passwordOpen && <form className="cpr-password-form" onSubmit={changePassword}><label>Current Password<input required type="password" name="currentPassword" autoComplete="current-password" /></label><label>New Password<input required type="password" name="newPassword" autoComplete="new-password" minLength="8" /></label><label>Confirm New Password<input required type="password" name="confirmPassword" autoComplete="new-password" minLength="8" /></label><button className="cpr-primary-button" type="submit">Update Password</button>{passwordMessage && <p role="status">{passwordMessage}</p>}</form>}</>}
        </section>
        <aside className="cpr-side-column">
          <section className="cpr-overview-card"><header className="cpr-section-heading"><h2><span>♙</span> Account Overview</h2><a href="/customer_order">View All</a></header><div className="cpr-stat-grid"><a href="/customer_order"><span className="purple">▣</span><b>12</b><small>Total Orders</small></a><a href="/customer_wishlist"><span className="pink">♡</span><b>{wishlistCount}</b><small>Wishlist Items</small></a><a href="/storefront#reviews"><span className="green">☆</span><b>8</b><small>Reviews</small></a><a href="/customer_checkout"><span className="blue">⌖</span><b>2</b><small>Saved Addresses</small></a></div></section>
          <section className="cpr-actions-card"><h2><span>ϟ</span> Quick Actions</h2><a href="/customer_order"><i className="purple">▣</i><span><b>View My Orders</b><small>Track and manage your orders</small></span><strong>›</strong></a><a href="/customer_checkout"><i className="blue">⌖</i><span><b>Manage Addresses</b><small>Add or edit delivery addresses</small></span><strong>›</strong></a><a href="/customer_wishlist"><i className="pink">♡</i><span><b>My Wishlist</b><small>View your saved items</small></span><strong>›</strong></a><a href="/storefront#reviews"><i className="purple">☆</i><span><b>Write a Review</b><small>Share your feedback</small></span><strong>›</strong></a></section>
        </aside>
      </div>
    </main>
    <Footer />
  </div>;
}
