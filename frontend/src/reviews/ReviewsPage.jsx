import { useMemo, useState } from 'react';
import { sampleReviews } from './reviewData.js';

const ratings = ['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
const statuses = ['All Statuses', 'Approved', 'Pending', 'Rejected'];

function Stars({ rating, large = false }) {
  return <span className={`review-stars ${large ? 'large' : ''}`} aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <i className={index < rating ? 'filled' : ''} key={index}>★</i>)}</span>;
}

function ReviewStats({ reviews }) {
  const stats = [
    ['Total Reviews', '248', 'violet', '★', '+12% vs last month'],
    ['Positive Reviews', '198', 'green', '☻', '+15% vs last month'],
    ['Neutral Reviews', '32', 'orange', '◉', '+8% vs last month'],
    ['Negative Reviews', '18', 'red', '☹', '-5% vs last month'],
  ];
  const _visibleCount = reviews.length;
  return <div className="review-stats">{stats.map(([label, value, color, icon, note]) => <article key={label}>
    <span className={`review-stat-icon ${color}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
  </article>)}</div>;
}

function ReviewDetails({ review, onClose, onEdit, onDelete, onSetStatus }) {
  if (!review) return <aside className="review-details-panel review-no-selection"><p>Select a review to see details.</p></aside>;
  return (
    <aside className="review-details-panel">
      <div className="review-details-title"><h2>Review Details</h2><button type="button" aria-label="Close review details" onClick={onClose}>×</button></div>
      <div className="review-product">
        <span className="review-product-image">{review.productIcon}</span>
        <span><strong>{review.product}</strong><small>#{review.productId}</small><Stars rating={review.rating} /></span>
      </div>
      <section className="review-detail-section">
        <h3>Customer Information</h3>
        <div className="review-detail-customer"><i>{review.customer.split(' ').map((name) => name[0]).join('')}</i><span><strong>{review.customer}</strong><small>{review.email}</small><small>Member since: Jan 2025</small></span></div>
      </section>
      <section className="review-detail-section">
        <h3>Review Content</h3>
        <Stars rating={review.rating} large />
        <strong className="review-detail-rating">{review.rating.toFixed(1)}</strong>
        <p className="review-detail-text">{review.review}</p>
        <div className="review-attachments" aria-label="Review product photos"><span>{review.productIcon}</span><span>{review.productIcon}</span><span>{review.productIcon}</span></div>
      </section>
      <section className="review-detail-section review-metadata">
        <h3>Review Metadata</h3>
        <dl><div><dt>Review ID</dt><dd>#{review.id}</dd></div><div><dt>Status</dt><dd><span className={`review-status ${review.status.toLowerCase()}`}>{review.status}</span></dd></div><div><dt>Submitted On</dt><dd>{review.submitted}</dd></div><div><dt>Last Updated</dt><dd>{review.updated}</dd></div></dl>
      </section>
      <section className="review-detail-actions">
        <h3>Actions</h3>
        {review.status === 'Pending' && <button type="button" className="review-approve-button" onClick={() => onSetStatus(review.id, 'Approved')}>✓ Approve Review</button>}
        <button type="button" className="review-edit-button" onClick={() => onEdit(review)}>✎ Edit Review</button>
        <button type="button" className="review-delete-button" onClick={() => onDelete(review)}>♜ Delete Review</button>
      </section>
    </aside>
  );
}

function ReviewEditDialog({ review, onCancel, onSave }) {
  const [rating, setRating] = useState(review.rating);
  const [text, setText] = useState(review.review);
  const [status, setStatus] = useState(review.status);
  return <div className="review-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <form className="review-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="review-edit-title" onSubmit={(event) => { event.preventDefault(); onSave({ ...review, rating, review: text.trim(), status, updated: 'Just now' }); }}>
      <button type="button" className="review-dialog-close" aria-label="Close" onClick={onCancel}>×</button>
      <h2 id="review-edit-title">Edit Review</h2><p>Update the rating, review text, or moderation status.</p>
      <label>Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} stars</option>)}</select></label>
      <label>Review<textarea value={text} onChange={(event) => setText(event.target.value)} rows="4" required /></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.slice(1).map((value) => <option key={value}>{value}</option>)}</select></label>
      <div className="review-dialog-actions"><button type="button" className="review-edit-button" onClick={onCancel}>Cancel</button><button type="submit" className="review-approve-button">Save Changes</button></div>
    </form>
  </div>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(sampleReviews);
  const [selectedId, setSelectedId] = useState(sampleReviews[0].id);
  const [query, setQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sort, setSort] = useState('Latest');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const selected = reviews.find((review) => review.id === selectedId) || null;

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((review) => {
      const searchText = `${review.product} ${review.productId} ${review.customer} ${review.email} ${review.review}`.toLowerCase();
      const requestedRating = ratingFilter === 'All Ratings' ? null : Number(ratingFilter[0]);
      return (!query || searchText.includes(query.toLowerCase())) &&
        (!requestedRating || review.rating === requestedRating) &&
        (statusFilter === 'All Statuses' || review.status === statusFilter) &&
        (!dateFilter || review.dateValue === dateFilter) &&
        (!dateFrom || review.dateValue >= dateFrom) &&
        (!dateTo || review.dateValue <= dateTo);
    });
    return [...filtered].sort((left, right) => sort === 'Lowest Rating'
      ? left.rating - right.rating
      : sort === 'Highest Rating'
        ? right.rating - left.rating
        : sort === 'Oldest'
          ? left.date.localeCompare(right.date)
          : right.date.localeCompare(left.date));
  }, [dateFilter, dateFrom, dateTo, query, ratingFilter, reviews, sort, statusFilter]);

  const updateStatus = (id, status) => setReviews((items) => items.map((review) => review.id === id ? { ...review, status, updated: 'Just now' } : review));
  const updateReview = (updatedReview) => {
    setReviews((items) => items.map((review) => review.id === updatedReview.id ? updatedReview : review));
    setEditTarget(null);
  };
  const removeReview = () => {
    setReviews((items) => items.filter((review) => review.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
  };

  return (
    <section className="reviews-page">
      <div className="reviews-heading">
        <div><h1>Reviews</h1><p>View and manage customer reviews for your products.</p></div>
        <button type="button" className="reviews-filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}>{showFilters ? 'Hide Filters' : '⚑ Manage Filters'}</button>
      </div>
      <div className="reviews-layout">
        <div className="reviews-main">
          <ReviewStats reviews={reviews} />
          <section className="reviews-card">
            <div className="reviews-toolbar">
              <label className="reviews-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product name, customer name or review..." /></label>
              <select aria-label="Filter by rating" value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>{ratings.map((rating) => <option key={rating}>{rating}</option>)}</select>
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
              <select aria-label="Sort reviews" value={sort} onChange={(event) => setSort(event.target.value)}><option value="Latest">Sort by: Latest</option><option value="Oldest">Sort by: Oldest</option><option value="Highest Rating">Highest Rating</option><option value="Lowest Rating">Lowest Rating</option></select>
              <label className="reviews-calendar-button" title="Filter by date">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.25" y="3.5" width="11.5" height="10" rx="1.5" /><path d="M5 2v3M11 2v3M2.5 6.5h11" /></svg>
                <input type="date" aria-label="Filter reviews by date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
              </label>
            </div>
            {showFilters && <div className="reviews-extra-filters"><label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><button type="button" onClick={() => { setQuery(''); setRatingFilter('All Ratings'); setStatusFilter('All Statuses'); setSort('Latest'); setDateFilter(''); setDateFrom(''); setDateTo(''); }}>Clear all</button></div>}
            <div className="reviews-table-wrap"><table className="reviews-table">
              <thead><tr><th><input type="checkbox" aria-label="Select all reviews" /></th><th>#</th><th>PRODUCT</th><th>CUSTOMER</th><th>RATING</th><th>REVIEW</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead>
              <tbody>{visibleReviews.map((review, index) => <tr key={review.id} className={selectedId === review.id ? 'selected' : ''} onClick={() => setSelectedId(review.id)}>
                <td><input type="checkbox" aria-label={`Select review ${review.id}`} onClick={(event) => event.stopPropagation()} /></td><td>{index + 1}</td>
                <td><span className="reviews-product-cell"><i>{review.productIcon}</i><span><strong>{review.product}</strong><small>#{review.productId}</small></span></span></td>
                <td><span className="reviews-customer-cell"><strong>{review.customer}</strong><small>{review.email}</small></span></td>
                <td><span className="reviews-rating-cell"><Stars rating={review.rating} /><small>{review.rating.toFixed(1)}</small></span></td>
                <td className="reviews-review-text">{review.review}</td>
                <td><span className={`review-status ${review.status.toLowerCase()}`}>{review.status}</span></td><td>{review.date}</td>
                <td><span className="reviews-row-actions"><button type="button" title="View details" aria-label={`View ${review.id}`} onClick={(event) => { event.stopPropagation(); setSelectedId(review.id); }}>◉</button><button type="button" title="Edit review" aria-label={`Edit ${review.id}`} onClick={(event) => { event.stopPropagation(); setSelectedId(review.id); setEditTarget(review); }}>✎</button><button type="button" className="delete" title="Delete review" aria-label={`Delete ${review.id}`} onClick={(event) => { event.stopPropagation(); setDeleteTarget(review); }}>♜</button></span></td>
              </tr>)}</tbody>
            </table></div>
            {!visibleReviews.length && <div className="reviews-empty">No reviews match your search or filters.</div>}
            <footer className="reviews-footer"><span>Showing {visibleReviews.length ? 1 : 0} to {visibleReviews.length} of 248 reviews</span><div><button disabled aria-label="Previous page">‹</button><b>1</b>{[2, 3, 4, 5, 6].map((number) => <button type="button" key={number} onClick={() => setSelectedId(reviews[(number - 1) % reviews.length]?.id)}>{number}</button>)}<button type="button" aria-label="Next page">›</button></div></footer>
          </section>
        </div>
        <ReviewDetails review={selected} onClose={() => setSelectedId(null)} onEdit={setEditTarget} onDelete={setDeleteTarget} onSetStatus={updateStatus} />
      </div>
      <p className="reviews-data-note">Review records and summary totals shown here are sample data; this backend does not currently provide a Reviews API. Changes are kept in page state only.</p>
      {editTarget && <ReviewEditDialog review={editTarget} onCancel={() => setEditTarget(null)} onSave={updateReview} />}
      {deleteTarget && <div className="review-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}><section className="review-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="review-delete-title"><button type="button" className="review-dialog-close" aria-label="Close" onClick={() => setDeleteTarget(null)}>×</button><span className="review-delete-symbol">♜</span><h2 id="review-delete-title">Delete Review?</h2><p>This will remove the review from this sample page session.</p><div className="review-dialog-actions"><button type="button" className="review-edit-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="review-delete-button" onClick={removeReview}>Delete Review</button></div></section></div>}
    </section>
  );
}
