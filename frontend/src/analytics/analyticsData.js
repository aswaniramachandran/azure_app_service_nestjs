export const analyticsSample = {
  dates: ['Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27'],
  sales: [980, 1480, 1260, 1760, 1050, 1510, 1680],
  orders: [560, 680, 540, 910, 520, 720, 860],
  categories: [
    { name: 'Headphones', amount: 4320, share: 34.6, color: '#7565fa' },
    { name: 'Smartwatches', amount: 2860, share: 22.9, color: '#3993f8' },
    { name: 'Speakers', amount: 1960, share: 15.9, color: '#30c894' },
    { name: 'Earbuds', amount: 1520, share: 12.2, color: '#f5a33a' },
    { name: 'Accessories', amount: 1160, share: 9.3, color: '#f26877' },
    { name: 'Others', amount: 642, share: 5.1, color: '#9daac1' },
  ],
  orderStatuses: [
    { label: 'Pending', value: 158, color: '#ffa53b' },
    { label: 'Processing', value: 124, color: '#438df5' },
    { label: 'Shipped', value: 98, color: '#7865f7' },
    { label: 'Delivered', value: 76, color: '#36c895' },
    { label: 'Cancelled', value: 23, color: '#ef6670' },
  ],
  customers: [82, 94, 121, 124, 119, 155, 170],
  returning: [44, 50, 62, 66, 69, 82, 94],
  locations: [
    { country: 'United States', sales: 5240, share: '42.0%' },
    { country: 'Canada', sales: 2180, share: '17.5%' },
    { country: 'United Kingdom', sales: 1560, share: '12.5%' },
    { country: 'Germany', sales: 980, share: '7.9%' },
    { country: 'Others', sales: 2522, share: '20.2%' },
  ],
};
