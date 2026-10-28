import { useEffect, useState } from 'react';

const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

export default function ProductFormPage({ product, onCancel, onSave, onEditCreated, apiRequest }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
    categoryId: product?.categoryId ?? product?.category?.id ?? '',
    brandId: product?.brandId ?? product?.brand?.id ?? '',
  });
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [brandsError, setBrandsError] = useState('');
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(product?.imageUrl || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdProduct, setCreatedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    async function loadCategories() {
      try {
        const response = await apiRequest('/categories');
        const records = Array.isArray(response) ? response : response?.data;
        if (isCurrent) setCategories(Array.isArray(records) ? records : []);
      } catch (loadError) {
        if (isCurrent) setCategoriesError(loadError.message || 'Unable to load categories.');
      } finally {
        if (isCurrent) setCategoriesLoading(false);
      }
    }

    loadCategories();
    return () => {
      isCurrent = false;
    };
  }, [apiRequest]);

  useEffect(() => {
    let isCurrent = true;
    async function loadBrands() {
      try {
        const response = await apiRequest('/brands');
        const records = Array.isArray(response) ? response : response?.data;
        if (!Array.isArray(records)) {
          throw new Error('The brands API returned an invalid response.');
        }
        if (isCurrent) setBrands(records);
      } catch (loadError) {
        if (isCurrent) setBrandsError(loadError.message || 'Unable to load brands.');
      } finally {
        if (isCurrent) setBrandsLoading(false);
      }
    }

    loadBrands();
    return () => {
      isCurrent = false;
    };
  }, [apiRequest]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const imageUrl = URL.createObjectURL(imageFile);
    setPreview(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageFile]);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSuccess('');
  };

  const updateImage = (event) => {
    setSuccess('');
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImageFile(null);
      setPreview(product?.imageUrl || '');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, or WEBP image.');
      event.target.value = '';
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
      categoryId: String(form.categoryId),
      brandId: String(form.brandId),
    };
    if (
      !payload.name ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !Number.isInteger(payload.quantity) ||
      payload.quantity < 0
    ) {
      setError('Enter a product name, a valid non-negative price, and a whole-number stock quantity.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const savedProduct = await onSave(payload, imageFile);
      if (!product) {
        setCreatedProduct(savedProduct?.data || savedProduct);
      }
      setSuccess(product ? 'Product updated successfully.' : 'Product saved successfully.');
    } catch (saveError) {
      setError(saveError.message || `Unable to ${product ? 'update' : 'save'} this product.`);
    } finally {
      setSaving(false);
    }
  }

  const available = Number(form.quantity) > 0;

  return (
    <section className="product-page">
      <div className="product-heading product-form-heading">
        <div>
          <span className="product-kicker">{product ? 'PRODUCT CATALOG / EDIT' : 'PRODUCT CATALOG / NEW'}</span>
          <h1>{product ? 'Edit Product' : 'Add New Product'}</h1>
          <p>{product ? 'Update product details and inventory.' : 'Fill in the details below to add a new product to your store.'}</p>
        </div>
      </div>

      <form className="product-form-layout" onSubmit={submit}>
        <div className="product-form-main">
          <section className="product-form-card">
            <h2>Basic Information</h2>
            <label>Product Name<input name="name" value={form.name} onChange={update} required maxLength={120} placeholder="Enter product name" /></label>
            <label>Category<select name="categoryId" value={form.categoryId} onChange={update} disabled={categoriesLoading}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            {categoriesError && <p className="product-api-error" role="alert">{categoriesError}</p>}
            <label>Brand<select name="brandId" value={form.brandId} onChange={update} disabled={brandsLoading}><option value="">No brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            {brandsLoading && <p className="product-supported-fields" role="status">Loading brands…</p>}
            {brandsError && <p className="product-api-error" role="alert">{brandsError}</p>}
            <div className="product-form-two">
              <label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} required placeholder="0.00" /></label>
              <label>Stock Quantity<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={update} required placeholder="0" /></label>
            </div>
            <p className="product-supported-fields">These fields are saved to your database: product name, price, quantity, and one image.</p>
          </section>
          <section className="product-form-card product-pricing-card">
            <h2>Pricing &amp; Stock</h2>
            <div className="product-form-two">
              <div className="product-readonly-value"><small>Unit price</small><strong>{currency(form.price)}</strong></div>
              <div className="product-readonly-value"><small>Stock status</small><strong className={available ? 'available' : 'unavailable'}>{available ? 'In Stock' : 'Out of Stock'}</strong></div>
            </div>
          </section>
        </div>

        <aside className="product-form-side">
          <section className="product-form-card">
            <h2>Product Image</h2>
            <label className="product-image-drop">
              {preview ? <img src={preview} alt="Product preview" /> : <><span>⇧</span><strong>Click to upload an image</strong><small>JPG, PNG or WEBP</small></>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={updateImage} />
            </label>
            <small className="product-image-hint">One product image is supported by the current API.</small>
          </section>

          <section className="product-form-card product-status-card">
            <h2>Status</h2>
            <span className={`product-stock-badge ${available ? 'in' : 'out'}`}>{available ? '● Active' : '● Out of Stock'}</span>
          </section>

          {error && <p className="product-api-error" role="alert">{error}</p>}
          {success && <p className="product-form-success" role="status"><span aria-hidden="true">✓</span>{success}</p>}
          <div className="product-form-actions">
            <button className="product-secondary-button" type="button" onClick={onCancel}>{product ? 'Cancel' : 'Back'}</button>
            {createdProduct?.id != null && !product ? (
              <button
                className="product-primary-button"
                type="button"
                onClick={() => onEditCreated(createdProduct)}
              >
                Edit Product
              </button>
            ) : (
              <button className="product-primary-button" type="submit" disabled={saving}>{saving ? product ? 'Updating…' : 'Saving…' : product ? 'Update Product' : 'Save Product'}</button>
            )}
          </div>
        </aside>
      </form>
    </section>
  );
}
