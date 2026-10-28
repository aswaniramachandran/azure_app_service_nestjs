export const sampleOrders = [
  { id: 'ORD-1047', customer: 'John Smith', email: 'john.smith@example.com', initials: 'JS', product: 'Wireless Headphones', items: [{ name: 'Wireless Headphones', quantity: 1, price: 149 }], amount: 149, payment: 'Paid', status: 'Delivered', date: 'Apr 28, 2025', address: '123 Market Street, San Francisco, CA 94103', method: 'Visa ending in 4242' },
  { id: 'ORD-1046', customer: 'Emily Wilson', email: 'emily.wilson@example.com', initials: 'EW', product: 'Earbuds Pro', items: [{ name: 'Earbuds Pro', quantity: 1, price: 89 }], amount: 89, payment: 'Paid', status: 'Shipped', date: 'Apr 28, 2025', address: '84 King Street, New York, NY 10001', method: 'Mastercard ending in 1088' },
  { id: 'ORD-1045', customer: 'Michael Johnson', email: 'michael.j@example.com', initials: 'MJ', product: 'Smartwatch', items: [{ name: 'Smartwatch', quantity: 1, price: 199 }], amount: 199, payment: 'Paid', status: 'Processing', date: 'Apr 27, 2025', address: '92 Lake Road, Austin, TX 73301', method: 'Visa ending in 0051' },
  { id: 'ORD-1044', customer: 'Sarah Lee', email: 'sarah.lee@example.com', initials: 'SL', product: 'Bluetooth Speaker', items: [{ name: 'Bluetooth Speaker', quantity: 1, price: 79 }], amount: 79, payment: 'Paid', status: 'Delivered', date: 'Apr 27, 2025', address: '18 Park Avenue, Seattle, WA 98101', method: 'PayPal' },
  { id: 'ORD-1043', customer: 'David Rodriguez', email: 'david.r@example.com', initials: 'DR', product: 'Wireless Headphones', items: [{ name: 'Wireless Headphones', quantity: 1, price: 149 }], amount: 149, payment: 'Paid', status: 'Shipped', date: 'Apr 26, 2025', address: '54 Sunset Blvd, Los Angeles, CA 90028', method: 'Visa ending in 7113' },
  { id: 'ORD-1042', customer: 'Olivia Martin', email: 'olivia.m@example.com', initials: 'OM', product: 'Smartwatch', items: [{ name: 'Smartwatch', quantity: 2, price: 199 }], amount: 398, payment: 'Pending', status: 'Pending', date: 'Apr 26, 2025', address: '241 Pine Street, Portland, OR 97204', method: 'Visa ending in 4102' },
  { id: 'ORD-1041', customer: 'Noah Thomas', email: 'noah.t@example.com', initials: 'NT', product: 'Earbuds Pro', items: [{ name: 'Earbuds Pro', quantity: 2, price: 89 }], amount: 178, payment: 'Paid', status: 'Processing', date: 'Apr 25, 2025', address: '730 Hillcrest Dr, Denver, CO 80202', method: 'Mastercard ending in 9940' },
  { id: 'ORD-1040', customer: 'Ava Martinez', email: 'ava.m@example.com', initials: 'AM', product: 'Laptop', items: [{ name: 'Laptop', quantity: 1, price: 899 }], amount: 899, payment: 'Refunded', status: 'Cancelled', date: 'Apr 25, 2025', address: '16 Ocean View, Miami, FL 33101', method: 'Visa ending in 3342' },
  { id: 'ORD-1039', customer: 'Ethan Brown', email: 'ethan.b@example.com', initials: 'EB', product: 'Bluetooth Speaker', items: [{ name: 'Bluetooth Speaker', quantity: 2, price: 79 }], amount: 158, payment: 'Paid', status: 'Delivered', date: 'Apr 24, 2025', address: '501 Broad Street, Boston, MA 02110', method: 'American Express ending in 6721' },
  { id: 'ORD-1038', customer: 'Mia Davis', email: 'mia.d@example.com', initials: 'MD', product: 'Wireless Headphones', items: [{ name: 'Wireless Headphones', quantity: 1, price: 149 }], amount: 149, payment: 'Refunded', status: 'Cancelled', date: 'Apr 23, 2025', address: '27 Cedar Lane, Chicago, IL 60601', method: 'PayPal' },
];

export const orderStatuses = [
  ['All Orders', '▤'],
  ['Pending Orders', '◷'],
  ['Processing Orders', '⟳'],
  ['Shipped Orders', '➤'],
  ['Delivered Orders', '✓'],
  ['Cancelled Orders', '×'],
];
