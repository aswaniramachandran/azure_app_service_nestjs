import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 10;

const EMPTY_META = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function CategoryImage({ imageUrl, alt, className }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  function handleImageError() {
    console.error('Category image failed to load:', imageUrl);
    setFailed(true);
  }

  return (
    <span className={className}>
      {imageUrl && !failed
        ? <img src={imageUrl} alt={alt} onError={handleImageError} />
        : <span className="category-image-fallback" aria-hidden="true">▧</span>}
    </span>
  );
}

export default function CategoriesPage({ page, onNavigate, apiRequest }) {
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const formPage = page === 'Add Category' || page === 'Edit Category';
  const category = page === 'Edit Category' ? editing : null;

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(category?.imageUrl || '');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile, category?.imageUrl]);

  const loadCategories = useCallback(async (searchTerm = '', pageNumber = 1, isCurrent = () => true) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pageNumber), limit: String(PAGE_SIZE) });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await apiRequest(`/categories?${params.toString()}`);
      if (isCurrent()) {
        setCategories(Array.isArray(response?.data) ? response.data : []);
        setMeta(response?.meta || EMPTY_META);
      }
    } catch (requestError) {
      if (isCurrent()) {
        setCategories([]);
        setMeta(EMPTY_META);
        setError(requestError.message || 'Unable to load categories. Please try again.');
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    let isCurrent = true;
    const timeoutId = window.setTimeout(() => {
      loadCategories(search, currentPage, () => isCurrent);
    }, search.trim() ? 300 : 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentPage, loadCategories, search]);

  const hasProductCounts = categories.some((item) => item.productCount != null || item.count != null);
  const hasStatuses = categories.some((item) => item.status);

  function refreshCategories() {
    const alreadyAtDefault = !search && currentPage === 1;
    setSearch('');
    setCurrentPage(1);
    if (alreadyAtDefault) loadCategories('', 1);
  }

  async function save(event) {
    event.preventDefault();
    setFormError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const payload = new FormData();
    payload.append('name', name);
    payload.append('description', String(data.get('description') || ''));
    if (imageFile) payload.append('image', imageFile);

    setSaving(true);
    try {
      await apiRequest(category ? `/categories/${category.id}` : '/categories', {
        method: category ? 'PATCH' : 'POST',
        body: payload,
      });
      await loadCategories(search, currentPage);
      setEditing(null);
      setImageFile(null);
      onNavigate('Category List');
    } catch (requestError) {
      setFormError(requestError.message || 'Unable to save this category. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setError('');
    try {
      await apiRequest(`/categories/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await loadCategories(search, currentPage);
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this category. Please try again.');
    }
  }

  function startAddCategory() {
    setEditing(null);
    setImageFile(null);
    setFormError('');
    onNavigate('Add Category');
  }

  function startEditCategory(item) {
    setEditing(item);
    setImageFile(null);
    setFormError('');
    onNavigate('Edit Category');
  }

  function cancelForm() {
    setImageFile(null);
    setFormError('');
    onNavigate('Category List');
  }

  if (formPage) {
    return (
      <section className="category-page">
        <div className="category-breadcrumb">Workspace <b>/</b> Categories <b>/</b> {category ? 'Edit Category' : 'Add Category'}</div>
        <div className="category-heading"><div><span className="category-kicker">CATEGORY MANAGEMENT</span><h1>{category ? 'Edit Category' : 'Add Category'}</h1><p>{category ? 'Update category details and image.' : 'Create a new product category.'}</p></div></div>
        <form className="category-form-layout" onSubmit={save}>
          <section className="category-card">
            <h2>Category Image</h2>
            <label className="category-image-upload">{imagePreview ? <CategoryImage className="category-upload-image" imageUrl={imagePreview} alt={category?.name || 'Selected category'} /> : <span>⇧</span>}<strong>{imageFile?.name || 'Click to upload image'}</strong><small>PNG, JPG or WEBP</small><input type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImageFile(event.currentTarget.files?.[0] || null)} /></label>
          </section>
          <section className="category-card category-fields-card">
            <h2>Category Information</h2>
            <label>Category Name <i>*</i><input name="name" defaultValue={category?.name || ''} required placeholder="Enter category name" /></label>
            <label>Slug <i>*</i><input name="slug" defaultValue={category?.slug || slugify(category?.name || '')} onChange={(event) => { event.currentTarget.value = slugify(event.currentTarget.value); }} placeholder="category-url-slug" /></label>
            <label>Description<textarea name="description" defaultValue={category?.description || ''} rows="4" placeholder="Enter category description..." /></label>
            {formError && <p className="category-data-note" role="alert">{formError}</p>}
            <div className="category-form-actions"><button className="category-secondary" type="button" onClick={cancelForm}>Cancel</button><button className="category-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : category ? 'Update Category' : 'Save Category'}</button></div>
          </section>
        </form>
      </section>
    );
  }

  return (
    <section className="category-page">
      <div className="category-breadcrumb">Workspace <b>/</b> Categories</div>
      <div className="category-heading"><div><h1>Categories</h1><p>Manage product categories to keep your store organized.</p></div><button className="category-primary category-add-button" type="button" onClick={startAddCategory}><span>＋</span> Add Category</button></div>
      <div className="category-summary">
        <article><span className="category-summary-icon violet">▧</span><div><small>Total Categories</small><strong>{meta.total}</strong><em>from your database</em></div></article>
        <article><span className="category-summary-icon green">✓</span><div><small>Active</small><strong>{hasStatuses ? categories.filter((item) => item.status === 'Active').length : '—'}</strong><em>{hasStatuses ? 'visible categories' : 'not provided by API'}</em></div></article>
        <article><span className="category-summary-icon orange">▣</span><div><small>Products</small><strong>{hasProductCounts ? categories.reduce((total, item) => total + Number(item.productCount ?? item.count ?? 0), 0) : '—'}</strong><em>{hasProductCounts ? 'across categories' : 'not provided by API'}</em></div></article>
      </div>
      <section className="category-table-card">
        <header className="category-toolbar"><label className="category-search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search categories..." /></label><button className="product-icon-button" type="button" onClick={refreshCategories} disabled={loading} aria-label="Refresh categories" title="Refresh categories">↻</button></header>
        {error && <p className="category-data-note" role="alert">{error}</p>}
        {loading ? <div className="category-data-note">Loading categories…</div> : categories.length ? (
          <div className="category-table-wrap"><table className="category-table"><thead><tr><th>#</th><th>IMAGE</th><th>CATEGORY NAME</th><th>SLUG</th><th>PRODUCT COUNT</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{categories.map((item, index) => <tr key={item.id}><td>{(meta.page - 1) * meta.limit + index + 1}</td><td><CategoryImage className="category-thumb" imageUrl={item.imageUrl} alt={item.name} /></td><td><strong>{item.name}</strong></td><td className="category-slug">{item.slug || slugify(item.name)}</td><td>{item.productCount ?? item.count ?? '—'}</td><td>{item.status ? <span className={`category-status-pill ${item.status.toLowerCase()}`}>{item.status}</span> : '—'}</td><td><div className="category-actions"><button type="button" aria-label={`Edit ${item.name}`} onClick={() => startEditCategory(item)}>✎</button><button type="button" className="delete" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)}>▣</button></div></td></tr>)}</tbody></table></div>
        ) : <div className="category-data-note">{search ? 'No matching categories.' : 'No categories in your database yet.'}</div>}
        <footer className="category-table-footer"><span>Showing {meta.total ? (meta.page - 1) * meta.limit + 1 : 0} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} categories</span><div><button type="button" aria-label="Previous page" disabled={!meta.hasPreviousPage} onClick={() => setCurrentPage((pageNumber) => Math.max(1, pageNumber - 1))}>‹</button><b>{meta.page}</b><button type="button" aria-label="Next page" disabled={!meta.hasNextPage} onClick={() => setCurrentPage((pageNumber) => pageNumber + 1)}>›</button></div></footer>
      </section>
      {deleting && <div className="category-dialog-backdrop"><section className="category-delete-dialog" role="alertdialog" aria-modal="true"><button className="category-dialog-close" type="button" onClick={() => setDeleting(null)}>×</button><span className="category-delete-icon">▣</span><h2>Delete Category</h2><p>Are you sure you want to delete this category?<br />This action cannot be undone.</p><div className="category-delete-summary"><CategoryImage className="category-delete-image" imageUrl={deleting.imageUrl} alt="" /><div><strong>{deleting.name}</strong><small>{deleting.productCount ?? deleting.count ?? '—'} products</small></div><small>{deleting.slug || slugify(deleting.name)}</small></div>{error && <p className="category-data-note" role="alert">{error}</p>}<div className="category-form-actions"><button className="category-secondary" type="button" onClick={() => setDeleting(null)}>Cancel</button><button className="category-danger" type="button" onClick={confirmDelete}>Delete Category</button></div></section></div>}
    </section>
  );
}
