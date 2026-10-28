export const settingsSections = [
  ['General', '⌂'],
  ['Store Profile', '▣'],
  ['Account', '♙'],
  ['Security', '⛨'],
  ['Notifications', '♧'],
  ['Payment Settings', '▤'],
  ['Shipping Settings', '▣'],
  ['Order Settings', '◇'],
  ['Inventory Settings', '⬡'],
];

export const defaultSettings = {
  storeName: 'Stockroom',
  storeUrl: 'https://stockroom.com',
  email: 'support@stockroom.com',
  currency: 'USD ($)',
  phone: '+1 234 567 8900',
  timezone: '(UTC+05:30) Asia/Kolkata',
  storeLive: true,
  maintenance: false,
  language: 'English',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12 Hour (AM/PM)',
  businessHours: {
    Monday: ['09:00', '18:00', false],
    Tuesday: ['09:00', '18:00', false],
    Wednesday: ['09:00', '18:00', false],
    Thursday: ['09:00', '18:00', false],
    Friday: ['09:00', '18:00', false],
    Saturday: ['10:00', '16:00', false],
    Sunday: ['', '', true],
  },
};

export const settingsStorageKey = 'stockroom_store_settings';
