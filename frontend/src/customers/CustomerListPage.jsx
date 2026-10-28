import { useMemo, useState } from 'react';
import { sampleCustomers } from './customerData.js';

const cash = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function CustomerListPage({ onViewCustomer }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [sort, setSort] = useState('Newest');
  const [checked, setChecked] = useState([]);
  const active = sampleCustomers.filter((customer) => customer.status === 'Active').length;
  const filtered = useMemo(() => {
    const rows = sampleCustomers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'All Status' || customer.status === status),
    );
    return sort === 'Newest' ? rows : [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }, [query, sort, status]);

  const selectAll = () => setChecked(checked.length === filtered.length ? [] : filtered.map((customer) => customer.id));

  return (
    <section className="customers-page">
      <div className="customers-heading">
        <div><span className="customers-kicker">CUSTOMER MANAGEMENT</span><h1>Customer List</h1><p>View and manage all your customers in one place.</p></div>
        <span className="customers-demo-badge">SAMPLE DATA</span>
      </div>
      <div className="customers-stats">
        <article><span className="customer-stat-icon violet">♙</span><div><small>Total Customers</small><strong>248</strong><em>all registered customers</em></div></article>
        <article><span className="customer-stat-icon green">✓</span><div><small>Active Customers</small><strong>{active}</strong><em>currently active</em></div></article>
        <article><span className="customer-stat-icon blue">▤</span><div><small>This Month</small><strong>32</strong><em>new customers</em></div></article>
        <article><span className="customer-stat-icon orange">＄</span><div><small>Avg. Customer Value</small><strong>$145</strong><em>average spent</em></div></article>
      </div>
      <section className="customers-table-card">
        <header className="customers-toolbar">
          <label className="customers-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers by name, email or phone..." /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter customers"><option>All Status</option><option>Active</option><option>Inactive</option></select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort customers"><option>Newest</option><option>Name</option></select>
        </header>
        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead><tr><th><input type="checkbox" checked={filtered.length > 0 && checked.length === filtered.length} onChange={selectAll} aria-label="Select all" /></th><th>#</th><th>CUSTOMER</th><th>EMAIL</th><th>PHONE</th><th>TOTAL ORDERS</th><th>SPENT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>{filtered.map((customer, index) => (
              <tr key={customer.id}>
                <td><input type="checkbox" checked={checked.includes(customer.id)} onChange={() => setChecked((current) => current.includes(customer.id) ? current.filter((id) => id !== customer.id) : [...current, customer.id])} aria-label={`Select ${customer.name}`} /></td>
                <td>{index + 1}</td>
                <td><button className="customer-person" type="button" onClick={() => onViewCustomer(customer)}><i className={customer.color}>{customer.initials}</i><strong>{customer.name}</strong></button></td>
                <td>{customer.email}</td><td>{customer.phone}</td><td>{customer.orders}</td><td><strong>{cash(customer.spent)}</strong></td>
                <td><span className={`customer-status ${customer.status.toLowerCase()}`}>{customer.status}</span></td>
                <td><div className="customer-actions"><button type="button" title="View customer" aria-label={`View ${customer.name}`} onClick={() => onViewCustomer(customer)}>◉</button><button type="button" title="Edit customer" aria-label={`Edit ${customer.name}`}>✎</button><button className="delete" type="button" title="Delete customer" aria-label={`Delete ${customer.name}`}><svg viewBox="0 0 20 20"><path d="M4.5 6h11l-.8 10.2a1.2 1.2 0 0 1-1.2 1.1h-7a1.2 1.2 0 0 1-1.2-1.1L4.5 6ZM3 4.5h14M7.2 4.5V3.4c0-.5.4-.9.9-.9h3.8c.5 0 .9.4.9.9v1.1M8 8.5v5.8M12 8.5v5.8" /></svg></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <footer className="customers-table-footer"><span>Showing {filtered.length ? 1 : 0} to {filtered.length} of 248 customers</span><div><button disabled>‹</button><b>1</b><button>2</button><button>3</button><button>›</button></div></footer>
      </section>
      <p className="customers-data-note">Customer and purchase details are sample UI data; the backend currently exposes no customer API.</p>
    </section>
  );
}
