import { useCallback, useEffect, useState } from 'react';

export default function BrandsPage({ apiRequest }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiRequest('/brands');
      const records = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(records)) {
        throw new Error('The brands API returned an invalid response.');
      }
      setBrands(records);
    } catch (loadError) {
      setBrands([]);
      setError(loadError.message || 'Unable to load brands. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  function startAdd() {
    setEditing(null);
    setFormOpen(true);
    setName('');
    setError('');
    setSuccess('');
  }

  function startEdit(brand) {
    setEditing(brand);
    setFormOpen(true);
    setName(brand.name);
    setError('');
    setSuccess('');
  }

  async function saveBrand(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a brand name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest(editing ? `/brands/${editing.id}` : '/brands', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({ name: trimmedName }),
      });
      const wasEditing = Boolean(editing);
      setEditing(null);
      setFormOpen(false);
      setName('');
      await loadBrands();
      setSuccess(wasEditing ? 'Brand updated successfully.' : 'Brand added successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this brand. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteBrand() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    setSuccess('');
    try {
      await apiRequest(`/brands/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await loadBrands();
      setSuccess('Brand deleted successfully.');
    } catch (deleteError) {
      setDeleteError(deleteError.message || 'Unable to delete this brand. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="brand-page">
      <div className="category-breadcrumb">Workspace <b>/</b> Brands</div>
      <div className="category-heading">
        <div><h1>Brands</h1><p>Manage the brands available for your products.</p></div>
        {!editing && <button className="category-primary category-add-button" type="button" onClick={startAdd}><span>＋</span> Add Brand</button>}
      </div>

      {(error || success) && (
        <p className={error ? 'brand-message brand-message-error' : 'brand-message brand-message-success'} role={error ? 'alert' : 'status'}>
          {error || success}
        </p>
      )}

      {formOpen && (
        <form className="brand-form category-card" onSubmit={saveBrand}>
          <h2>{editing ? 'Edit Brand' : 'Add Brand'}</h2>
          <label>
            Brand Name
            <input autoFocus name="brandName" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} placeholder="Enter brand name" />
          </label>
          <div className="category-form-actions">
            <button className="category-secondary" type="button" onClick={() => { setFormOpen(false); setEditing(null); setName(''); }}>Cancel</button>
            <button className="category-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Brand' : 'Save Brand'}</button>
          </div>
        </form>
      )}

      <section className="category-table-card brand-table-card">
        <header className="category-toolbar">
          <strong>All Brands</strong>
          <button className="product-icon-button" type="button" onClick={loadBrands} disabled={loading} aria-label="Refresh brands" title="Refresh brands">↻</button>
        </header>
        {loading ? <p className="category-data-note" role="status">Loading brands…</p> : brands.length ? (
          <div className="category-table-wrap">
            <table className="category-table">
              <thead><tr><th>ID</th><th>BRAND NAME</th><th>ACTIONS</th></tr></thead>
              <tbody>{brands.map((brand) => (
                <tr key={brand.id}>
                  <td>{brand.id}</td>
                  <td><strong>{brand.name}</strong></td>
                  <td><div className="category-actions">
                    <button type="button" aria-label={`Edit ${brand.name}`} onClick={() => startEdit(brand)}>✎</button>
                    <button type="button" className="delete" aria-label={`Delete ${brand.name}`} onClick={() => { setDeleteError(''); setDeleteTarget(brand); }}>▣</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="category-data-note">{error ? 'Brands could not be loaded.' : 'No brands have been added yet.'}</p>}
      </section>
      {deleteTarget && (
        <div className="product-dialog-backdrop" role="presentation">
          <section className="product-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-brand-title">
            <button className="product-dialog-close" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Close">×</button>
            <span className="product-delete-icon">!</span>
            <h2 id="delete-brand-title">Delete Brand</h2>
            <p>Are you sure you want to delete this brand? This action cannot be undone.</p>
            <div className="product-delete-summary brand-delete-summary">
              <span className="brand-delete-mark" aria-hidden="true">◈</span>
              <span><strong>{deleteTarget.name}</strong><small>Brand ID: {deleteTarget.id}</small></span>
            </div>
            {deleteError && <p className="product-api-error" role="alert">{deleteError}</p>}
            <div className="product-form-actions">
              <button className="product-secondary-button" type="button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="product-danger-button" type="button" disabled={deleting} onClick={confirmDeleteBrand}>{deleting ? 'Deleting…' : 'Delete Brand'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
