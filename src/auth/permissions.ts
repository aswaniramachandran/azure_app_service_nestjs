export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',

  PRODUCTS_MANAGE = 'products:manage',
  CATEGORIES_MANAGE = 'categories:manage',

  ORDERS_VIEW = 'orders:view',
  ORDERS_MANAGE = 'orders:manage',

  CUSTOMERS_VIEW = 'customers:view',

  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_MANAGE = 'inventory:manage',

  PAYMENTS_VIEW = 'payments:view',
  PAYMENTS_MANAGE = 'payments:manage',

  COUPONS_MANAGE = 'coupons:manage',
  BANNERS_MANAGE = 'banners:manage',
  REVIEWS_MANAGE = 'reviews:manage',

  ANALYTICS_VIEW = 'analytics:view',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PRESETS: Record<string, Permission[]> = {
  PRODUCT_MANAGER: [
    Permission.DASHBOARD_VIEW, Permission.PRODUCTS_MANAGE, Permission.CATEGORIES_MANAGE,
    Permission.INVENTORY_VIEW, Permission.INVENTORY_MANAGE,
  ],
  ORDER_MANAGER: [
    Permission.DASHBOARD_VIEW, Permission.ORDERS_VIEW, Permission.ORDERS_MANAGE,
    Permission.CUSTOMERS_VIEW,
  ],
  FINANCE: [
    Permission.DASHBOARD_VIEW, Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE,
    Permission.ORDERS_VIEW, Permission.ANALYTICS_VIEW,
  ],
  MARKETING: [
    Permission.DASHBOARD_VIEW, Permission.COUPONS_MANAGE, Permission.BANNERS_MANAGE,
    Permission.ANALYTICS_VIEW,
  ],
  SUPPORT: [
    Permission.DASHBOARD_VIEW, Permission.REVIEWS_MANAGE, Permission.CUSTOMERS_VIEW,
    Permission.ORDERS_VIEW,
  ],
};