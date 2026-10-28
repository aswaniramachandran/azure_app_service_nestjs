import { useMemo, useState } from 'react';
import { paymentPages, sampleTransactions } from './paymentData.js';

const money = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(amount);

const pageStatus = {
  'Successful Transactions': 'Successful',
  'Failed Transactions': 'Failed',
  'Refunded Transactions': 'Refunded',
};

const titles = {
  Payments: 'All Transactions',
  'All Transactions': 'All Transactions',
  'Successful Transactions': 'Successful Transactions',
  'Failed Transactions': 'Failed Transactions',
  'Refunded Transactions': 'Refunded Transactions',
};

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

function PaymentStats({ transactions, page }) {
  const successful = transactions.filter((transaction) => transaction.status === 'Successful');
  const failed = transactions.filter((transaction) => transaction.status === 'Failed');
  const refunded = transactions.filter((transaction) => transaction.status === 'Refunded');
  const totals = {
    successful: successful.reduce((sum, item) => sum + item.amount, 0),
    failed: failed.reduce((sum, item) => sum + item.amount, 0),
    refunded: refunded.reduce((sum, item) => sum + item.amount, 0),
  };
  const successRate = transactions.length
    ? Math.round((successful.length / transactions.length) * 1000) / 10
    : 0;
  const data = page === 'Successful Transactions'
    ? [
        ['Total Successful', String(successful.length), 'teal', '✓', 'transactions'],
        ['Successful Volume', money(totals.successful), 'blue', '$', 'processed'],
        ['Success Rate', `${successRate}%`, 'green', '↗', 'of transactions'],
      ]
    : page === 'Failed Transactions'
      ? [
          ['Failed Transactions', String(failed.length), 'red', '!', 'transactions'],
          ['Failed Amount', money(totals.failed), 'orange', '$', 'unsuccessful'],
          ['Failure Rate', `${transactions.length ? Math.round((failed.length / transactions.length) * 1000) / 10 : 0}%`, 'purple', '↗', 'of transactions'],
        ]
      : page === 'Refunded Transactions'
        ? [
            ['Total Refunded', String(refunded.length), 'teal', '↩', 'transactions'],
            ['Refund Volume', money(totals.refunded), 'red', '$', 'returned'],
            ['Refund Rate', `${transactions.length ? Math.round((refunded.length / transactions.length) * 1000) / 10 : 0}%`, 'purple', '↗', 'of transactions'],
          ]
        : [
            ['Total Transactions', String(transactions.length), 'purple', '▤', 'all records'],
            ['Successful', money(totals.successful), 'green', '✓', `${successful.length} payments`],
            ['Failed', money(totals.failed), 'red', '!', `${failed.length} payments`],
            ['Refunded', money(totals.refunded), 'blue', '↩', `${refunded.length} payments`],
          ];

  return (
    <div className={`payment-stats ${data.length === 3 ? 'three' : ''}`}>
      {data.map(([label, value, color, icon, note]) => (
        <article className="payment-stat" key={label}>
          <span className={`payment-stat-icon ${color}`}>{icon}</span>
          <div className="payment-stat-copy">
            <small>{label}</small>
            <strong>{value}</strong>
            <em>{note}</em>
          </div>
          <span className={`payment-sparkline ${color}`} aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i />
          </span>
        </article>
      ))}
    </div>
  );
}

function PaymentDetails({ transaction, onBack }) {
  const timeline = [
    ['Order Placed', 'Apr 28, 2025 · 10:22 AM', true],
    ['Payment Initiated', 'Apr 28, 2025 · 10:23 AM', true],
    ['Payment Confirmed', 'Apr 28, 2025 · 10:24 AM', transaction.status === 'Successful'],
    [transaction.status === 'Refunded' ? 'Refunded' : 'Order Processed', 'Apr 28, 2025 · 10:26 AM', transaction.status === 'Successful' || transaction.status === 'Refunded'],
  ];

  return (
    <section className="payment-detail-page">
      <div className="payment-heading payment-detail-heading">
        <div>
          <span className="payment-eyebrow">PAYMENTS / TRANSACTIONS / DETAILS</span>
          <h1>Payment Details</h1>
          <p>View the details and status of this payment transaction.</p>
        </div>
        <button className="payment-back-button" type="button" onClick={onBack}>← Back to Transactions</button>
      </div>
      <div className="payment-detail-grid">
        <article className="payment-detail-card payment-receipt-card">
          <span className={`payment-status ${statusClass(transaction.status)}`}>{transaction.status}</span>
          <h2>{transaction.orderId}</h2>
          <p>{transaction.date}</p>
          <strong className="payment-receipt-amount">{money(transaction.amount)}</strong>
          <span className="payment-receipt-caption">Total paid</span>
          <button className="payment-receipt-button" type="button" onClick={() => window.print()}>Download Receipt</button>
        </article>

        <article className="payment-detail-card">
          <h3>Customer Information</h3>
          <div className="payment-customer">
            <span className="payment-customer-avatar">{transaction.initials}</span>
            <span><strong>{transaction.customer}</strong><small>{transaction.email}</small></span>
          </div>
          <p className="payment-address">Customer details are sample data for this preview.</p>
        </article>

        <article className="payment-detail-card">
          <h3>Payment Information</h3>
          <dl className="payment-info-list">
            <div><dt>Payment Method</dt><dd>{transaction.method}</dd></div>
            <div><dt>Payment Status</dt><dd><span className={`payment-status ${statusClass(transaction.status)}`}>{transaction.status}</span></dd></div>
            <div><dt>Transaction ID</dt><dd>{transaction.id}</dd></div>
            <div><dt>Gateway</dt><dd>Sample payment gateway</dd></div>
            <div><dt>Order ID</dt><dd>{transaction.orderId}</dd></div>
            <div><dt>Refund Status</dt><dd>{transaction.status === 'Refunded' ? 'Refunded' : 'Not refunded'}</dd></div>
          </dl>
        </article>

        <article className="payment-detail-card payment-order-items-card">
          <h3>Order Items</h3>
          <div className="payment-items-head"><span>ITEM</span><span>QTY</span><span>PRICE</span></div>
          {transaction.items.map((item) => (
            <div className="payment-item-row" key={item.name}>
              <span><i aria-hidden="true">▣</i><b>{item.name}</b></span>
              <span>{item.quantity}</span>
              <strong>{money(item.amount)}</strong>
            </div>
          ))}
          <div className="payment-total-row"><span>Total</span><strong>{money(transaction.amount)}</strong></div>
        </article>

        <article className="payment-detail-card payment-timeline-card">
          <h3>Order Status</h3>
          <ol>
            {timeline.map(([label, date, complete], index) => (
              <li className={complete ? 'complete' : ''} key={label}>
                <i>{complete ? '✓' : index + 1}</i>
                <span><strong>{label}</strong><small>{date}</small></span>
              </li>
            ))}
          </ol>
        </article>
      </div>
      <p className="payment-data-note">Payment details are illustrative sample data; no payment provider or transaction API is connected.</p>
    </section>
  );
}

export default function PaymentPage({ page, onNavigate }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [methodFilter, setMethodFilter] = useState('All Methods');
  const [selectedTransaction, setSelectedTransaction] = useState(sampleTransactions[0]);
  const title = titles[page] || 'All Transactions';
  const targetStatus = pageStatus[page];

  const visibleTransactions = useMemo(() => sampleTransactions.filter((transaction) => {
    const searchText = `${transaction.id} ${transaction.orderId} ${transaction.customer} ${transaction.method}`.toLowerCase();
    return (!targetStatus || transaction.status === targetStatus) &&
      (!query || searchText.includes(query.toLowerCase())) &&
      (statusFilter === 'All Statuses' || transaction.status === statusFilter) &&
      (methodFilter === 'All Methods' || transaction.method.startsWith(methodFilter));
  }), [methodFilter, page, query, statusFilter, targetStatus]);

  if (page === 'Payment Details') {
    return <PaymentDetails transaction={selectedTransaction} onBack={() => onNavigate('All Transactions')} />;
  }

  return (
    <section className="payments-page">
      <div className="payment-heading">
        <div>
          <span className="payment-eyebrow">PAYMENT MANAGEMENT</span>
          <h1>{title}</h1>
          <p>View and manage customer payment transactions.</p>
        </div>
        <span className="payment-sample-badge">SAMPLE DATA</span>
      </div>

      <PaymentStats transactions={sampleTransactions} page={page} />

      <section className="payment-table-card">
        <div className="payment-filterbar">
          <label className="payment-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by transaction, order, customer..." /></label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by payment status">
            <option>All Statuses</option><option>Successful</option><option>Failed</option><option>Refunded</option><option>Pending</option>
          </select>
          <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} aria-label="Filter by payment method">
            <option>All Methods</option><option>Visa</option><option>Mastercard</option><option>PayPal</option><option>American Express</option>
          </select>
          <button className="payment-filter-button" type="button" onClick={() => { setQuery(''); setStatusFilter('All Statuses'); setMethodFilter('All Methods'); }}>⚑ Filter</button>
          <button className="payment-export-button" type="button" onClick={() => window.print()}>⇩ Export</button>
        </div>

        <div className="payment-table-wrap">
          <table className="payment-table">
            <thead><tr><th>#</th><th>DATE &amp; TIME</th><th>TRANSACTION ID</th><th>ORDER ID</th><th>CUSTOMER</th><th>AMOUNT</th><th>PAYMENT METHOD</th><th>STATUS</th><th>ACTION</th></tr></thead>
            <tbody>
              {visibleTransactions.map((transaction, index) => (
                <tr key={transaction.id} onClick={() => { setSelectedTransaction(transaction); onNavigate('Payment Details'); }} tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && (setSelectedTransaction(transaction), onNavigate('Payment Details'))}>
                  <td>{index + 1}</td>
                  <td>{transaction.date}</td>
                  <td><strong>{transaction.id}</strong></td>
                  <td>{transaction.orderId}</td>
                  <td><span className="payment-customer-cell"><i>{transaction.initials}</i>{transaction.customer}</span></td>
                  <td><strong>{money(transaction.amount)}</strong></td>
                  <td>{transaction.method}</td>
                  <td><span className={`payment-status ${statusClass(transaction.status)}`}>{transaction.status}</span></td>
                  <td><button type="button" className="payment-view-button" aria-label={`View ${transaction.id}`} onClick={(event) => { event.stopPropagation(); setSelectedTransaction(transaction); onNavigate('Payment Details'); }}>⌕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleTransactions.length && <div className="payment-empty">No sample transactions match your filters.</div>}
        </div>
        <footer className="payment-table-footer"><span>Showing {visibleTransactions.length ? 1 : 0} to {visibleTransactions.length} of {visibleTransactions.length} transactions</span><div><button disabled aria-label="Previous page">‹</button><b>1</b><button disabled aria-label="Next page">›</button></div></footer>
      </section>
      <p className="payment-data-note">Transactions use illustrative sample data because this backend does not currently provide a payments or transactions API. These records are not saved to your database.</p>
    </section>
  );
}

export { paymentPages };
