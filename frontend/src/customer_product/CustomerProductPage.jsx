import { useEffect, useMemo, useState } from 'react';
import './customer-product.css';
import { useCustomerWishlist } from '../customer_wishlist/useCustomerWishlist.js';
import { addCustomerCartItem, notifyCustomerCartUpdated } from '../customer_cart/customerCartApi.js';
import { fetchCustomerBrands, fetchCustomerCategories, fetchCustomerProducts } from './customerCatalogApi.js';

const PRODUCTS_PER_PAGE = 8;

function StoreMark() {
  return <a className="cp-brand" href="/storefront" aria-label="Stockroom home"><span className="cp-brand-mark"><i /><i /><i /></span><b>stockroom</b></a>;
}

function ProductCard({ product, onAdd, isFavorite, onFavorite, isFavoriteBusy, isAdding, visualSearchActive = false }) {
  const price = Number(product.price) || 0;
  const inStock = Number(product.quantity) > 0;
  return <article className="cp-product-card">
    <a className="cp-product-photo" href={`/customer_product/detail?id=${encodeURIComponent(product.id)}`} aria-label={`View ${product.name} details`}>
      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span aria-label="No product image">▧</span>}
      {product.isNew || product.discount ? <span className={`cp-discount ${product.isNew ? 'cp-new' : ''}`}>{product.isNew ? 'New' : `-${product.discount}%`}</span> : null}
      {visualSearchActive && Number.isFinite(Number(product.similarity)) && <span className="cp-visual-match">{Math.round(Math.max(0, Math.min(1, Number(product.similarity))) * 100)}% match</span>}
      <button className={`cp-heart ${isFavorite ? 'is-favorite' : ''}`} type="button" disabled={isFavoriteBusy} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${product.name} ${isFavorite ? 'from' : 'to'} wishlist`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onFavorite(); }}>{isFavorite ? '♥' : '♡'}</button>
    </a>
    <div className="cp-product-info">
      <a className="cp-product-name" href={`/customer_product/detail?id=${encodeURIComponent(product.id)}`}>{product.name}</a>
      <p>{product.categoryName || 'Category unavailable'}</p>
      {visualSearchActive && <span className={`cp-visual-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>{inStock ? 'In stock' : 'Out of stock'}</span>}
      {product.rating != null && <div className="cp-rating"><span>★★★★★</span><small>{product.rating} ({product.reviews ?? 0})</small></div>}
      <div className="cp-price"><strong>${price.toFixed(2)}</strong>{Number(product.originalPrice) > price && <del>${Number(product.originalPrice).toFixed(2)}</del>}</div>
      <div className="cp-product-bottom"><div className="cp-swatches" aria-label="Available colors">{(product.colors || []).map((color) => <i key={color} style={{ backgroundColor: color }} />)}</div><button className="cp-add-button" type="button" disabled={isAdding || (visualSearchActive && !inStock)} onClick={() => onAdd(product)}>{visualSearchActive && !inStock ? <span>Out of Stock</span> : <>♧ <span>{isAdding ? 'Adding…' : 'Add to Cart'}</span></>}</button><a className="cp-quick-view" href={`/customer_product/detail?id=${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>◉</a></div>
    </div>
  </article>;
}

export default function CustomerProductPage({
  search = '',
  onSearchChange = () => {},
  visualSearchResults = null,
  visualSearchCount = 0,
  onClearVisualSearch = () => {},
}) {
  const initialQuery = new URLSearchParams(window.location.search);
  const initialCategoryName = initialQuery.get('category') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialQuery.get('categoryId') || '');
  const [selectedBrandId, setSelectedBrandId] = useState(initialQuery.get('brandId') || '');
  const [minPrice, setMinPrice] = useState(initialQuery.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(initialQuery.get('maxPrice') || '');
  const [priceError, setPriceError] = useState('');
  const [priceSourceProducts, setPriceSourceProducts] = useState([]);
  const [priceRangesLoading, setPriceRangesLoading] = useState(true);
  const [priceRangesError, setPriceRangesError] = useState('');
  const [page, setPage] = useState(1);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const { items: wishlistItems, loading: wishlistLoading, error: wishlistError, isProductBusy, toggleProduct } = useCustomerWishlist();
  const searchTerm = search.trim();

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerCategories()
      .then((records) => {
        if (isCurrent) {
          setCategories(records);
          if (!selectedCategoryId && initialCategoryName) {
            const initialCategory = records.find((category) => category.name.toLowerCase() === initialCategoryName.toLowerCase());
            if (initialCategory) setSelectedCategoryId(String(initialCategory.id));
          }
        }
      })
      .catch((requestError) => {
        if (isCurrent) setCategoriesError(requestError.message || 'Unable to load categories. Please try again.');
      })
      .finally(() => {
        if (isCurrent) setCategoriesLoading(false);
      });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerBrands()
      .then((records) => { if (isCurrent) setBrands(records); })
      .catch((requestError) => {
        if (isCurrent) {
          setBrands([]);
          setBrandsError(requestError.message || 'Unable to load brands. Please try again.');
        }
      })
      .finally(() => { if (isCurrent) setBrandsLoading(false); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerProducts()
      .then((records) => { if (isCurrent) setPriceSourceProducts(records); })
      .catch((requestError) => {
        if (isCurrent) {
          setPriceRangesError(requestError.message || 'Unable to load price ranges. Please try again.');
        }
      })
      .finally(() => { if (isCurrent) setPriceRangesLoading(false); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (categoriesLoading) return undefined;
    const minimum = minPrice === '' ? undefined : Number(minPrice);
    const maximum = maxPrice === '' ? undefined : Number(maxPrice);
    if (
      (minimum !== undefined && (!Number.isInteger(minimum) || minimum < 0)) ||
      (maximum !== undefined && (!Number.isInteger(maximum) || maximum < 0)) ||
      (minimum !== undefined && maximum !== undefined && minimum > maximum)
    ) {
      setLoading(false);
      setProducts([]);
      setError('');
      setPriceError('Enter a valid price range with the minimum no greater than the maximum.');
      return undefined;
    }

    let isCurrent = true;
    setLoading(true);
    setError('');
    setPriceError('');
    fetchCustomerProducts(selectedCategoryId, selectedBrandId, minPrice, maxPrice)
      .then((records) => { if (isCurrent) setProducts(records); })
      .catch((requestError) => {
        if (isCurrent) {
          setProducts([]);
          setError(requestError.message || 'Unable to load products. Please try again.');
        }
      })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, [categoriesLoading, selectedCategoryId, selectedBrandId, minPrice, maxPrice]);

  const priceRanges = useMemo(() => {
    const prices = priceSourceProducts
      .map((product) => Number(product.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    if (!prices.length) return [];

    const highestPrice = Math.ceil(Math.max(...prices));
    const ranges = [];
    const lowestPrice = Math.floor(Math.min(...prices));

    if (lowestPrice < 300) {
      ranges.push({ minimum: '', maximum: '299', label: 'Under $300' });
    }
    if (highestPrice >= 300) {
      ranges.push({ minimum: '300', maximum: '1000', label: '$300 – $1,000' });
    }
    if (highestPrice > 1000) {
      const remainingStart = 1001;
      const rangeCount = Math.min(3, highestPrice - remainingStart + 1);
      const rangeSize = Math.ceil((highestPrice - remainingStart + 1) / rangeCount);
      for (let index = 0; index < rangeCount; index += 1) {
        const minimum = remainingStart + index * rangeSize;
        const maximum = Math.min(highestPrice, minimum + rangeSize - 1);
        ranges.push({
          minimum: String(minimum),
          maximum: String(maximum),
          label: `$${minimum.toLocaleString()} – $${maximum.toLocaleString()}`,
        });
      }
    }

    return ranges;
  }, [priceSourceProducts]);
  const selectedPriceRange = priceRanges.find(
    (range) => range.minimum === minPrice && range.maximum === maxPrice,
  );
  const customPriceRange = minPrice || maxPrice
    ? {
      minimum: minPrice,
      maximum: maxPrice,
      label: `Custom: ${minPrice ? `$${minPrice}` : 'Any'} – ${maxPrice ? `$${maxPrice}` : 'Any'}`,
    }
    : null;
  const priceRangeValue = selectedPriceRange
    ? `${selectedPriceRange.minimum}:${selectedPriceRange.maximum}`
    : customPriceRange ? `${customPriceRange.minimum}:${customPriceRange.maximum}` : '';

  const categoriesById = new Map(categories.map((category) => [Number(category.id), category.name]));
  const categorizedProducts = products.map((product) => ({
    ...product,
    categoryName: product.category?.name || categoriesById.get(Number(product.categoryId)) || '',
  }));
  const visualProducts = Array.isArray(visualSearchResults)
    ? visualSearchResults.map((product) => ({
      ...product,
      categoryName: product.categoryName || categoriesById.get(Number(product.categoryId)) || '',
    }))
    : [];
  const visualSearchActive = Array.isArray(visualSearchResults);

  const visibleProducts = useMemo(
    () => categorizedProducts.filter((product) =>
      !searchTerm || `${product.name} ${product.categoryName || ''} ${product.brand?.name || product.brand || ''}`.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    [categorizedProducts, searchTerm],
  );

  const totalPages = Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE);
  const pageProducts = visibleProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);
  const displayedProducts = visualSearchActive ? visualProducts : pageProducts;
  const pageWindowStart = Math.max(1, Math.min(page - 1, totalPages - 3));
  const pageNumbers = Array.from({ length: Math.min(4, totalPages) }, (_, index) => pageWindowStart + index);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(totalPages, 1)));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const updateCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setPage(1);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('category');
    if (categoryId) searchParams.set('categoryId', categoryId);
    else searchParams.delete('categoryId');
    window.history.replaceState(null, '', `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ''}`);
  };

  const updateBrand = (brandId) => {
    setSelectedBrandId(brandId);
    setPage(1);
    const searchParams = new URLSearchParams(window.location.search);
    if (brandId) searchParams.set('brandId', brandId);
    else searchParams.delete('brandId');
    window.history.replaceState(null, '', `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ''}`);
  };

  const updatePriceRange = (value) => {
    const [minimum = '', maximum = ''] = value ? value.split(':') : [];
    setMinPrice(minimum);
    setMaxPrice(maximum);
    setPage(1);

    const searchParams = new URLSearchParams(window.location.search);
    if (minimum) searchParams.set('minPrice', minimum);
    else searchParams.delete('minPrice');
    if (maximum) searchParams.set('maxPrice', maximum);
    else searchParams.delete('maxPrice');
    window.history.replaceState(null, '', `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ''}`);
  };

  const addToCart = async (product) => {
    setCartBusy(true);
    setCartMessage('');
    setCartError('');
    try {
      const cart = await addCustomerCartItem(product.id, 1);
      notifyCustomerCartUpdated(cart);
      setCartMessage(`${product.name} added to your cart.`);
    } catch (requestError) {
      setCartError(requestError.message || 'Unable to add this product to your cart.');
    } finally {
      setCartBusy(false);
    }
  };

  return <div className="customer-products">
    <main className="cp-main">
      <section className="cp-title-banner"><div className="cp-breadcrumb"><a href="/storefront">Home</a><span>›</span><b>Products</b></div><h1>Our Products</h1><p>Discover the best electronics and accessories for your lifestyle.</p></section>
      <section className="cp-filter-bar" aria-label="Product filters">
        <label><span>▦</span><select aria-label="Filter by category" value={selectedCategoryId} onChange={(event) => updateCategory(event.target.value)} disabled={visualSearchActive || categoriesLoading}><option value="">All Categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span>♧</span><select aria-label="Filter by brand" value={selectedBrandId} onChange={(event) => updateBrand(event.target.value)} disabled={visualSearchActive || brandsLoading}><option value="">{brandsLoading ? 'Loading brands…' : 'All Brands'}</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
        <label><span>＄</span><select aria-label="Filter by price range" value={priceRangeValue} onChange={(event) => updatePriceRange(event.target.value)} disabled={visualSearchActive || priceRangesLoading || !priceRanges.length}><option value="">{priceRangesLoading ? 'Loading prices…' : 'All Prices'}</option>{customPriceRange && !selectedPriceRange && <option value={priceRangeValue}>{customPriceRange.label}</option>}{priceRanges.map((range) => <option key={`${range.minimum}:${range.maximum}`} value={`${range.minimum}:${range.maximum}`}>{range.label}</option>)}</select></label>
      </section>
      {visualSearchActive && <div className="cp-visual-search-active" role="status"><span>Showing {Number(visualSearchCount) || visualProducts.length} visual search {Number(visualSearchCount) === 1 ? 'match' : 'matches'}</span><button type="button" onClick={onClearVisualSearch}>Clear image search ×</button></div>}
      <div className="cp-results"><span>{visualSearchActive ? `${visualProducts.length ? 1 : 0}–${visualProducts.length} of ${Number(visualSearchCount) || visualProducts.length} visual matches` : loading || categoriesLoading ? 'Loading products…' : `Showing ${visibleProducts.length ? (page - 1) * PRODUCTS_PER_PAGE + 1 : 0}–${Math.min(page * PRODUCTS_PER_PAGE, visibleProducts.length)} of ${visibleProducts.length} products`}</span>{!visualSearchActive && (searchTerm || selectedCategoryId || selectedBrandId || minPrice || maxPrice) && <button type="button" onClick={() => { onSearchChange(''); setSelectedCategoryId(''); setSelectedBrandId(''); setMinPrice(''); setMaxPrice(''); setPriceError(''); setPage(1); const searchParams = new URLSearchParams(window.location.search); searchParams.delete('category'); searchParams.delete('categoryId'); searchParams.delete('brandId'); searchParams.delete('minPrice'); searchParams.delete('maxPrice'); window.history.replaceState(null, '', `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ''}`); }}>Clear filters ×</button>}</div>
      {categoriesError && <p className="cp-empty" role="alert">Categories could not be loaded: {categoriesError}</p>}
      {brandsError && <p className="cp-empty" role="alert">Brands could not be loaded: {brandsError}</p>}
      {priceError && <p className="cp-empty" role="alert">{priceError}</p>}
      {priceRangesError && <p className="cp-empty" role="alert">{priceRangesError}</p>}
      {cartError && <p className="cp-empty" role="alert">{cartError}</p>}
      {cartMessage && <p className="cp-empty" role="status">{cartMessage}</p>}
      {wishlistError && <p className="cp-empty" role="alert">{wishlistError}</p>}
      {!visualSearchActive && error ? <p className="cp-empty" role="alert">{error}</p> : !visualSearchActive && (loading || categoriesLoading) ? <p className="cp-empty" role="status">Loading products…</p> : displayedProducts.length ? <div className="cp-grid">{displayedProducts.map((product) => <ProductCard key={product.id} product={product} visualSearchActive={visualSearchActive} isFavorite={wishlistItems.some((item) => Number(item.productId) === Number(product.id))} isFavoriteBusy={wishlistLoading || isProductBusy(product.id)} onFavorite={() => toggleProduct(product.id).catch(() => {})} onAdd={addToCart} isAdding={cartBusy} />)}</div> : <p className="cp-empty">{visualSearchActive ? 'No visually similar products were found for this image.' : products.length ? 'No products match these filters. Try adjusting your selections.' : 'No products are available right now.'}</p>}
      {!visualSearchActive && totalPages > 1 && <nav className="cp-pagination" aria-label="Product pages"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹ <span>Previous</span></button>{pageNumbers.map((number) => <button type="button" key={number} className={page === number ? 'active' : ''} aria-current={page === number ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}> <span>Next</span> ›</button></nav>}
    </main>
    <footer className="cp-footer"><div className="cp-footer-inner"><div className="cp-footer-brand"><StoreMark /><p>Your one-stop shop for the latest electronics,<br />gear and accessories.</p><div className="cp-social"><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="YouTube">▶</a><a href="#footer" aria-label="Pinterest">p</a></div></div><div><h2>Quick Links</h2><a href="/storefront">Home</a><a href="/customer_product">Products</a><a href="/customer_product">Categories</a><a href="/customer_product">Deals</a><a href="/storefront#reviews">About Us</a></div><div><h2>Customer Service</h2><a href="#footer">Help Center</a><a href="#footer">Shipping Info</a><a href="#footer">Returns Policy</a><a href="/customer_order">Track Order</a><a href="#footer">Contact Us</a></div><div><h2>My Account</h2><a href="/">Login / Register</a><a href="/customer_order">My Orders</a><a href="/">Wishlist</a><a href="/">Profile</a><a href="/">Addresses</a></div><div><h2>Payment Methods</h2><div className="cp-payments"><span>VISA</span><span>●●</span><span>PayPal</span><span>UPI</span></div></div></div><div className="cp-footer-bottom"><span>© 2025 Stockroom. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms &amp; Conditions</a><a href="#footer">Cookies</a></div></div></footer>
  </div>;
}
