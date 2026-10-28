import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/products.css';
import './styles/categories.css';
import './styles/category-images.css';
import './styles/brands.css';
import './styles/orders.css';
import './styles/customers.css';
import './styles/inventory.css';
import './styles/payments.css';
import './styles/coupons.css';
import './styles/reviews.css';
import './styles/analytics.css';
import './styles/settings.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
