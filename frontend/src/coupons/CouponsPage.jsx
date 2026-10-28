import { useMemo, useState } from 'react';
import { couponPages, initialCoupons } from './couponData.js';

const cash = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const blankCoupon = () => ({
  code: '',
  name: '',
  type: 'Percentage',
  value: '',
  minimumOrder: '',
  maximumDiscount: '',
  usageLimit: '',
  startDate: '',
  expiryDate: '',
  status: 'Active',
  used: 0,
  usage: [],
});

function CouponStats({ coupons }) {
  const active = coupons.filter((coupon) => coupon.status === 'Active').length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiring = coupons.filter((coupon) => {
    if (coupon.status !== 'Active' || !coupon.expiryDate) return false;
    const expiry = new Date(`${coupon.expiryDate}T23:59:59`);
    const daysRemaining = (expiry - today) / 86400000;
    return daysRemaining >= 0 && daysRemaining <= 30;
  }).length;
  const used = coupons.reduce((total, coupon) => total + coupon.used, 0);
  const stats = [
    ['Total Coupons', coupons.length, 'violet', '▧', '+12% vs last month'],
    ['Active Coupons', active, 'green', '◉', '+8% vs last month'],
    ['Expiring Soon', expiring, 'orange', '◷', 'within 30 days'],
    ['Total Used', used.toLocaleString(), 'purple', '♧', '+16% vs last month'],
  ];
  return (
    <div className="coupon-stats">
      {stats.map(([label, value, color, icon, note]) => (
        <article key={label}>
          <span className={`coupon-stat-icon ${color}`}>{icon}</span>
          <div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
        </article>
      ))}
    </div>
  );
}

function CouponForm({ coupon, onCancel, onSave, editing }) {
  const [form, setForm] = useState(() => ({ ...blankCoupon(), ...coupon }));
  const [error, setError] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event) {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.value || !form.startDate || !form.expiryDate) {
      setError('Complete all required fields before saving.');
      return;
    }
    if (new Date(form.expiryDate) < new Date(form.startDate)) {
      setError('Expiry date must be on or after the start date.');
      return;
    }
    setError('');
    onSave({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      value: Number(form.value),
      minimumOrder: Number(form.minimumOrder) || 0,
      maximumDiscount: Number(form.maximumDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
    });
  }

  return (
    <section className="coupon-form-page">
      <div className="coupon-breadcrumb">Workspace <b>/</b> Coupons <b>/</b> <strong>{editing ? 'Edit Coupon' : 'Create Coupon'}</strong></div>
      <div className="coupon-heading">
        <div><h1>{editing ? 'Edit Coupon' : 'Create Coupon'}</h1><p>{editing ? 'Update the details of your coupon.' : 'Set up a new discount code for your customers.'}</p></div>
      </div>
      <form className="coupon-form-card" onSubmit={submit}>
        <div className="coupon-form-grid">
          <label>Coupon Code <i>*</i><input value={form.code} onChange={(event) => set('code', event.target.value)} placeholder="e.g. WELCOME10" required /></label>
          <label>Discount Type <i>*</i><select value={form.type} onChange={(event) => set('type', event.target.value)}><option>Percentage</option><option>Fixed Amount</option></select></label>
          <label>Discount Value <i>*</i><span className="coupon-input-suffix"><input type="number" min="0.01" step="0.01" value={form.value} onChange={(event) => set('value', event.target.value)} required /><b>{form.type === 'Percentage' ? '%' : '$'}</b></span></label>
          <label>Minimum Order Amount<input type="number" min="0" step="0.01" value={form.minimumOrder} onChange={(event) => set('minimumOrder', event.target.value)} placeholder="$0.00" /></label>
          <label>Maximum Discount<input type="number" min="0" step="0.01" value={form.maximumDiscount} onChange={(event) => set('maximumDiscount', event.target.value)} placeholder="$0.00" /></label>
          <label>Usage Limit<input type="number" min="0" step="1" value={form.usageLimit} onChange={(event) => set('usageLimit', event.target.value)} placeholder="Unlimited" /></label>
          <label>Start Date <i>*</i><input type="date" value={form.startDate} onChange={(event) => set('startDate', event.target.value)} required /></label>
          <label>Expiry Date <i>*</i><input type="date" value={form.expiryDate} onChange={(event) => set('expiryDate', event.target.value)} required /></label>
        </div>
        <button className={`coupon-toggle ${form.status === 'Active' ? 'on' : ''}`} type="button" role="switch" aria-checked={form.status === 'Active'} onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}><i /></button>
        <div className="coupon-toggle-copy"><strong>Active</strong><small>Customers can use this coupon</small></div>
        {error && <p className="coupon-form-error" role="alert">{error}</p>}
        <div className="coupon-form-actions"><button type="button" className="coupon-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="coupon-primary">{editing ? 'Update Coupon' : 'Create Coupon'}</button></div>
      </form>
    </section>
  );
}

function CouponDetails({ coupon, onBack, onEdit }) {
  const discount = coupon.type === 'Percentage' ? `${coupon.value}%` : cash(coupon.value);
  return (
    <section className="coupon-details-page">
      <div className="coupon-breadcrumb">Workspace <b>/</b> Coupons <b>/</b> <strong>Coupon Details</strong></div>
      <div className="coupon-heading">
        <div><h1>Coupon Details</h1><p>View detailed information about this coupon.</p></div>
        <button type="button" className="coupon-secondary" onClick={onBack}>← Back to Coupons</button>
      </div>
      <article className="coupon-details-card">
        <div className="coupon-detail-hero">
          <span className="coupon-detail-ticket">▧</span>
          <div><strong>{coupon.code}</strong><small>{coupon.name} · {discount} off orders above {cash(coupon.minimumOrder)}</small></div>
          <span className={`coupon-pill ${coupon.status.toLowerCase()}`}>{coupon.status}</span>
          <div className="coupon-detail-actions"><button type="button" className="coupon-primary" onClick={onEdit}>✎ Edit Coupon</button></div>
          <div className="coupon-detail-metric"><small>Total Usage</small><strong>{coupon.used} / {coupon.usageLimit || '∞'}</strong></div>
          <div className="coupon-detail-metric"><small>Value Saved</small><strong>{cash(coupon.usage.reduce((sum, record) => sum + record.amount, 0))}</strong></div>
        </div>
        <div className="coupon-detail-columns">
          <section><h2>Discount Details</h2><dl className="coupon-detail-list">
            <div><dt>Discount Type</dt><dd>{coupon.type}</dd></div><div><dt>Discount Value</dt><dd>{discount}</dd></div><div><dt>Minimum Order Amount</dt><dd>{cash(coupon.minimumOrder)}</dd></div><div><dt>Maximum Discount</dt><dd>{cash(coupon.maximumDiscount)}</dd></div><div><dt>Usage Limit</dt><dd>{coupon.usageLimit || 'Unlimited'}</dd></div><div><dt>Start Date</dt><dd>{coupon.startDate || '—'}</dd></div><div><dt>Expiry Date</dt><dd>{coupon.expiryDate || '—'}</dd></div>
          </dl></section>
          <section className="coupon-usage-section"><h2>Usage History <span>{coupon.usage.length} records</span></h2>
            <div className="coupon-usage-table-wrap"><table className="coupon-usage-table"><thead><tr><th>DATE</th><th>ORDER ID</th><th>DISCOUNT AMOUNT</th></tr></thead><tbody>{coupon.usage.length ? coupon.usage.map((record) => <tr key={record.order}><td>{record.date}</td><td>{record.order}</td><td>{cash(record.amount)}</td></tr>) : <tr><td colSpan="3">No usage records yet.</td></tr>}</tbody></table></div>
          </section>
        </div>
        <div className="coupon-info-note"><b>i</b>This coupon expires on {coupon.expiryDate || 'the selected date'} when customers meet the minimum order amount of {cash(coupon.minimumOrder)}.</div>
      </article>
    </section>
  );
}

export default function CouponsPage({ page, onNavigate }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [selectedId, setSelectedId] = useState(initialCoupons[0].id);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedId) || coupons[0];

  const visibleCoupons = useMemo(() => coupons.filter((coupon) => {
    const text = `${coupon.code} ${coupon.name}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) &&
      (statusFilter === 'All' || coupon.status === statusFilter) &&
      (typeFilter === 'All' || coupon.type === typeFilter);
  }), [coupons, search, statusFilter, typeFilter]);

  const startCreate = () => {
    setSelectedId(null);
    onNavigate('Create Coupon');
  };
  const startEdit = (coupon) => {
    setSelectedId(coupon.id);
    onNavigate('Edit Coupon');
  };
  const saveCoupon = (data) => {
    if (page === 'Edit Coupon' && selectedCoupon) {
      setCoupons((items) => items.map((item) => item.id === selectedCoupon.id ? { ...item, ...data } : item));
      onNavigate('Coupon Details');
      return;
    }
    const created = { ...data, id: `cpn-${Date.now()}`, used: 0, usage: [] };
    setCoupons((items) => [created, ...items]);
    setSelectedId(created.id);
    onNavigate('Coupon List');
  };

  if (page === 'Create Coupon' || page === 'Edit Coupon') {
    return <CouponForm key={`${page}-${selectedCoupon?.id || 'new'}`} coupon={page === 'Edit Coupon' ? selectedCoupon : null} editing={page === 'Edit Coupon'} onCancel={() => onNavigate('Coupon List')} onSave={saveCoupon} />;
  }
  if (page === 'Coupon Details' && selectedCoupon) {
    return <CouponDetails coupon={selectedCoupon} onBack={() => onNavigate('Coupon List')} onEdit={() => startEdit(selectedCoupon)} />;
  }

  return (
    <section className="coupons-page">
      <div className="coupon-breadcrumb">Workspace <b>/</b> <strong>Coupons</strong></div>
      <div className="coupon-heading">
        <div><h1>Coupons</h1><p>Manage discount codes and promotions for your store.</p></div>
        <button type="button" className="coupon-primary" onClick={startCreate}><span>＋</span> Create Coupon</button>
      </div>
      <CouponStats coupons={coupons} />
      <section className="coupon-table-card">
        <div className="coupon-toolbar">
          <label className="coupon-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupons by code or name..." /></label>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">Status: All</option><option>Active</option><option>Inactive</option><option>Expired</option></select>
          <select aria-label="Filter by discount type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="All">Discount Type: All</option><option>Percentage</option><option>Fixed Amount</option></select>
          <button type="button" className="coupon-filter-button" onClick={() => { setSearch(''); setStatusFilter('All'); setTypeFilter('All'); }}>⚑ Filter</button>
        </div>
        <div className="coupon-table-wrap"><table className="coupon-table">
          <thead><tr><th><input type="checkbox" aria-label="Select all coupons" /></th><th>CODE</th><th>DISCOUNT</th><th>MIN. ORDER</th><th>MAX. DISCOUNT</th><th>USED</th><th>VALID UNTIL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>{visibleCoupons.map((coupon) => <tr key={coupon.id}>
            <td><input type="checkbox" aria-label={`Select ${coupon.code}`} /></td>
            <td><button type="button" className="coupon-code-button" onClick={() => { setSelectedId(coupon.id); onNavigate('Coupon Details'); }}><strong>{coupon.code}</strong><small>{coupon.name}</small></button></td>
            <td>{coupon.type === 'Percentage' ? `${coupon.value}% OFF` : `${cash(coupon.value)} OFF`}</td><td>{cash(coupon.minimumOrder)}</td><td>{cash(coupon.maximumDiscount)}</td><td>{coupon.used} / {coupon.usageLimit || '∞'}</td><td>{coupon.expiryDate}</td>
            <td><span className={`coupon-pill ${coupon.status.toLowerCase()}`}>{coupon.status}</span></td>
            <td><span className="coupon-row-actions"><button type="button" aria-label={`Edit ${coupon.code}`} onClick={() => startEdit(coupon)}>✎</button><button type="button" className="delete" aria-label={`Delete ${coupon.code}`} onClick={() => setDeleteCoupon(coupon)}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6 4.5V3h4v1.5m2 0-.5 8h-7l-.5-8m3 2v4m2-4v4" /></svg></button></span></td>
          </tr>)}</tbody>
        </table></div>
        {!visibleCoupons.length && <div className="coupon-empty">No coupons match your filters.</div>}
        <footer className="coupon-table-footer"><span>Showing {visibleCoupons.length ? 1 : 0} to {visibleCoupons.length} of {visibleCoupons.length} coupons</span><div><button disabled>‹</button><b>1</b><button disabled>›</button></div></footer>
      </section>
      <p className="coupon-data-note">Coupons are illustrative sample data because this backend does not currently provide a coupons API. Changes are kept in this page session only.</p>
      {deleteCoupon && <div className="coupon-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteCoupon(null)}>
        <section className="coupon-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="coupon-delete-title">
          <button className="coupon-dialog-close" type="button" aria-label="Close" onClick={() => setDeleteCoupon(null)}>×</button>
          <span className="coupon-delete-icon">▣</span><h2 id="coupon-delete-title">Delete Coupon?</h2>
          <p>Are you sure you want to delete the coupon <strong>{deleteCoupon.code}</strong>?</p>
          <div className="coupon-delete-actions"><button type="button" className="coupon-secondary" onClick={() => setDeleteCoupon(null)}>Cancel</button><button type="button" className="coupon-danger" onClick={() => { setCoupons((items) => items.filter((item) => item.id !== deleteCoupon.id)); if (selectedId === deleteCoupon.id) setSelectedId(null); setDeleteCoupon(null); }}>Delete</button></div>
        </section>
      </div>}
    </section>
  );
}

export { couponPages };
