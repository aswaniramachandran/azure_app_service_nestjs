import './customer-header-icons.css';

export function CartIcon() {
  return <svg className="customer-cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
  </svg>;
}

export function HeartIcon() {
  return <svg className="customer-heart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.8 8.7c0 4.1-8.8 10.3-8.8 10.3S3.2 12.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
  </svg>;
}

export function UserAvatar({ name }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return <span className="customer-user-avatar" aria-hidden="true">{initial}</span>;
}
