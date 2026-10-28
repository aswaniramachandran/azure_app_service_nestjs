import { useEffect, useState } from 'react';
import { defaultSettings, settingsSections, settingsStorageKey } from './settingsData.js';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function Switch({ checked, onChange, label }) {
  return <button className={`settings-switch ${checked ? 'enabled' : ''}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><i /></button>;
}

function AssetPicker({ label, kind, preview, onChange }) {
  return <div className="settings-asset">
    <span className="settings-asset-label">{label}</span>
    <div className="settings-asset-row">
      <div className={`settings-asset-preview ${kind}`}>{preview ? <img src={preview} alt={`${label} preview`} /> : kind === 'favicon' ? <span className="settings-logo-mark"><i /><i /><i /></span> : <span><b className="settings-logo-mark"><i /><i /><i /></b><strong>stockroom</strong></span>}</div>
      <label className="settings-upload-button">Change {label}<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" onChange={(event) => onChange(event.target.files?.[0] || null)} /></label>
      <small>Recommended size: {kind === 'favicon' ? '32 × 32' : '200 × 60'} px<br />Format: PNG, JPG</small>
    </div>
  </div>;
}

function GeneralSettings({ values, update, updateHours, assetPreviews, onAssetChange }) {
  return <>
    <section className="settings-card settings-store-information">
      <div className="settings-card-heading"><h2>Store Information</h2><p>Basic details about your store.</p></div>
      <div className="settings-store-grid">
        <div className="settings-fields-grid">
          <label>Store Name <i>*</i><input value={values.storeName} onChange={(event) => update('storeName', event.target.value)} /></label>
          <label>Store URL<input type="url" value={values.storeUrl} onChange={(event) => update('storeUrl', event.target.value)} /></label>
          <label>Email Address <i>*</i><input type="email" value={values.email} onChange={(event) => update('email', event.target.value)} /></label>
          <label>Default Currency<select value={values.currency} onChange={(event) => update('currency', event.target.value)}><option>USD ($)</option><option>INR (₹)</option><option>EUR (€)</option><option>GBP (£)</option><option>CAD ($)</option></select></label>
          <label>Phone Number<input type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} /></label>
          <label>Timezone<select value={values.timezone} onChange={(event) => update('timezone', event.target.value)}><option>(UTC+05:30) Asia/Kolkata</option><option>(UTC-08:00) America/Los_Angeles</option><option>(UTC-05:00) America/New_York</option><option>(UTC+00:00) Europe/London</option><option>(UTC+01:00) Europe/Paris</option></select></label>
        </div>
        <div className="settings-assets">
          <AssetPicker label="Store Logo" kind="logo" preview={assetPreviews.logo} onChange={(file) => onAssetChange('logo', file)} />
          <AssetPicker label="Favicon" kind="favicon" preview={assetPreviews.favicon} onChange={(file) => onAssetChange('favicon', file)} />
        </div>
      </div>
    </section>
    <div className="settings-status-grid">
      <section className="settings-card settings-switch-card"><div><h2>Store Status</h2><p>Enable or disable your store.</p></div><div className="settings-switch-row"><Switch label="Store is live" checked={values.storeLive} onChange={(checked) => update('storeLive', checked)} /><span><strong>{values.storeLive ? 'Store is Live' : 'Store is Offline'}</strong><small>{values.storeLive ? 'Your store is currently active and visible to customers.' : 'Your storefront is currently unavailable to customers.'}</small></span></div></section>
      <section className="settings-card settings-switch-card"><div><h2>Maintenance Mode</h2><p>Put your store in maintenance mode for updates.</p></div><div className="settings-switch-row"><Switch label="Enable maintenance mode" checked={values.maintenance} onChange={(checked) => update('maintenance', checked)} /><span><strong>Enable Maintenance Mode</strong><small>Your store will be visible only to admin users.</small></span></div></section>
    </div>
    <section className="settings-card settings-localization"><div className="settings-card-heading"><h2>Localization</h2><p>Set your region, language and format preferences.</p></div><div className="settings-localization-grid">
      <label>Default Language<select value={values.language} onChange={(event) => update('language', event.target.value)}><option>English</option><option>Hindi</option><option>French</option><option>Spanish</option></select></label>
      <label>Date Format<select value={values.dateFormat} onChange={(event) => update('dateFormat', event.target.value)}><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label>
      <label>Time Format<select value={values.timeFormat} onChange={(event) => update('timeFormat', event.target.value)}><option>12 Hour (AM/PM)</option><option>24 Hour</option></select></label>
    </div></section>
    <section className="settings-card settings-business-hours"><div className="settings-card-heading"><h2>Business Hours</h2><p>Set your store's operating hours (optional).</p></div><div className="settings-hours-grid">
      {weekDays.map((day) => {
        const [opens, closes, closed] = values.businessHours[day];
        return <div className={`settings-hour-row ${closed ? 'closed' : ''}`} key={day}><span>{day}</span>{closed ? <><Switch label={`${day} closed`} checked onChange={() => updateHours(day, 2, false)} /><small>Closed</small><span className="settings-hour-placeholder" /></> : <><input aria-label={`${day} opening time`} type="time" value={opens} onChange={(event) => updateHours(day, 0, event.target.value)} /><b>–</b><input aria-label={`${day} closing time`} type="time" value={closes} onChange={(event) => updateHours(day, 1, event.target.value)} /></>}</div>;
      })}
    </div></section>
  </>;
}

function SectionSettings({ section, values, update }) {
  const contents = {
    'Store Profile': ['Store Profile', 'Manage public store details and brand information.', [['Store Display Name', 'storeName', values.storeName], ['Website URL', 'storeUrl', values.storeUrl], ['Support Email', 'email', values.email], ['Contact Phone', 'phone', values.phone]]],
    Account: ['Account Preferences', 'Manage administrator account preferences.', [['Administrator Name', 'accountName', values.accountName || 'Admin'], ['Email Address', 'email', values.email], ['Language', 'language', values.language]]],
    Security: ['Security Settings', 'Control access and protect your store account.', [['Session Timeout', 'sessionTimeout', values.sessionTimeout || '30 minutes'], ['Password Update Reminder', 'passwordReminder', values.passwordReminder || 'Every 90 days']]],
    Notifications: ['Notification Settings', 'Choose which store events should send notifications.', [['Order Notifications', 'notifyOrders', values.notifyOrders !== false], ['Low Stock Alerts', 'notifyLowStock', values.notifyLowStock !== false], ['Customer Reviews', 'notifyReviews', values.notifyReviews !== false]]],
    'Payment Settings': ['Payment Settings', 'Configure the payment options available to your customers.', [['Default Currency', 'currency', values.currency], ['Payment Provider', 'paymentProvider', values.paymentProvider || 'Select a payment provider']]],
    'Shipping Settings': ['Shipping Settings', 'Set default shipping and delivery preferences.', [['Shipping Origin', 'shippingOrigin', values.shippingOrigin || ''], ['Default Shipping Fee', 'shippingFee', values.shippingFee || '0']]],
    'Order Settings': ['Order Settings', 'Configure order processing defaults.', [['Order ID Prefix', 'orderPrefix', values.orderPrefix || 'ORD-'], ['Order Confirmation', 'orderConfirmation', values.orderConfirmation !== false]]],
    'Inventory Settings': ['Inventory Settings', 'Set inventory alerts and stock tracking preferences.', [['Low Stock Threshold', 'lowStockThreshold', values.lowStockThreshold || '5'], ['Track Inventory', 'trackInventory', values.trackInventory !== false]]],
  };
  const [title, description, fields] = contents[section] || contents['Store Profile'];
  return <section className="settings-card settings-other-card"><div className="settings-card-heading"><h2>{title}</h2><p>{description}</p></div><div className="settings-fields-grid">
    {fields.map(([label, key, value]) => typeof value === 'boolean' ? <div className="settings-generic-switch" key={key}><span><strong>{label}</strong><small>Enable or disable this setting.</small></span><Switch label={label} checked={value} onChange={(checked) => update(key, checked)} /></div> : <label key={key}>{label}{key.toLowerCase().includes('email') ? <input type="email" value={value} onChange={(event) => update(key, event.target.value)} /> : <input value={value} onChange={(event) => update(key, event.target.value)} />}</label>)}
  </div></section>;
}

export default function SettingsPage({ page, onNavigate }) {
  const section = page === 'Settings' ? 'General' : page.replace(/ Settings$/, '');
  const [values, setValues] = useState(defaultSettings);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [assetPreviews, setAssetPreviews] = useState({ logo: '', favicon: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(settingsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValues({
          ...defaultSettings,
          ...parsed,
          businessHours: { ...defaultSettings.businessHours, ...(parsed.businessHours || {}) },
        });
      }
    } catch (storageError) {
      console.error('Could not load saved settings.', storageError);
      setError('Saved settings could not be loaded. Default values are shown.');
    }
  }, []);

  useEffect(() => () => {
    Object.values(assetPreviews).forEach((preview) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    });
  }, [assetPreviews]);

  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage('');
  };
  const updateHours = (day, index, value) => {
    setValues((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: current.businessHours[day].map((item, itemIndex) => itemIndex === index ? value : item),
      },
    }));
    setMessage('');
  };
  const updateAsset = (kind, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAssetPreviews((current) => {
      if (current[kind]?.startsWith('blob:')) URL.revokeObjectURL(current[kind]);
      return { ...current, [kind]: preview };
    });
    if (kind === 'logo') setLogoFile(file);
    else setFaviconFile(file);
  };
  const save = (event) => {
    event.preventDefault();
    setError('');
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(values));
      setMessage(`Settings saved on this device${logoFile || faviconFile ? '. Logo previews are temporary and need uploading to a storage service to persist.' : '.'}`);
    } catch (storageError) {
      console.error('Could not save settings.', storageError);
      setError('Settings could not be saved in this browser. Check available local storage.');
    }
  };

  return <section className="settings-page">
    <aside className="settings-section-nav">
      <div className="settings-nav-heading"><span>⚙</span><div><strong>Settings</strong><small>Manage your store settings and preferences.</small></div></div>
      <nav aria-label="Settings sections">{settingsSections.map(([label, icon]) => {
        const targetPage = label === 'General' ? 'Settings' : `${label} Settings`;
        return <button type="button" className={section === label ? 'active' : ''} key={label} onClick={() => { setMessage(''); setError(''); onNavigate(targetPage); }}><span>{icon}</span>{label}<b>›</b></button>;
      })}</nav>
    </aside>
    <main className="settings-main">
      <form onSubmit={save}>
        <header className="settings-main-heading"><div><h1>{section === 'General' ? 'General Settings' : section}</h1><p>{section === 'General' ? 'Configure basic store settings and preferences.' : `Configure your ${section.toLowerCase()} preferences.`}</p></div><button className="settings-save-button" type="submit">▣ <span>Save Changes</span></button></header>
        {section === 'General'
          ? <GeneralSettings values={values} update={update} updateHours={updateHours} assetPreviews={assetPreviews} onAssetChange={updateAsset} />
          : <SectionSettings section={section} values={values} update={update} />}
        {error && <p className="settings-error" role="alert">{error}</p>}
        {message && <p className="settings-success" role="status">{message}</p>}
      </form>
    </main>
  </section>;
}
