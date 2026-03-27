// Menu configuration for different user roles

export interface MenuItem {
  id: string;
  title: string;
  type: 'group' | 'collapse' | 'item';
  icon?: string;
  url?: string;
  children?: MenuItem[];
}

type UserRole = 'ADMIN' | 'EXPORTER' | 'BUYER' | 'SUPER_ADMIN' | 'admin' | 'exporter' | 'buyer' | 'super_admin';

// Super Admin Menu — full access including user deletion, logs, admin creation
const superAdminMenuItems: MenuItem[] = [
  {
    id: 'admin-dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
      { id: 'admin-overview', title: 'Overview', type: 'item', icon: 'dashboard', url: '/dashboard/admin' },
    ],
  },
  {
    id: 'admin-directory',
    title: 'Directory',
    type: 'group',
    children: [
      { id: 'admin-browse-directory', title: 'Browse Directory', type: 'item', icon: 'search', url: '/directory' },
      { id: 'admin-favorites', title: 'Favorite Directory', type: 'item', icon: 'heart', url: '/dashboard/admin/favorites' },
    ],
  },
  {
    id: 'admin-management',
    title: 'Management',
    type: 'group',
    children: [
      { id: 'admin-users', title: 'Manage Users', type: 'item', icon: 'user', url: '/dashboard/admin/users' },
      { id: 'admin-business-verifications', title: 'Manage Businesses', type: 'item', icon: 'building-check', url: '/dashboard/admin/business-verification' },
      { id: 'admin-products', title: 'Manage Products', type: 'item', icon: 'package-check', url: '/dashboard/admin/products-management' },
      { id: 'admin-ratings', title: 'Manage Ratings', type: 'item', icon: 'star', url: '/dashboard/admin/ratings' },
    ],
  },
  {
    id: 'admin-master-data',
    title: 'Master Data',
    type: 'group',
    children: [
      { id: 'admin-master-data-page', title: 'Industries & Sectors', type: 'item', icon: 'layers', url: '/dashboard/admin/master-data' },
    ],
  },
  {
    id: 'admin-communication',
    title: 'Communication',
    type: 'group',
    children: [
      { id: 'admin-inquiries', title: 'Inquiries', type: 'item', icon: 'help-circle', url: '/dashboard/admin/inquiries' },
      { id: 'admin-newsletter', title: 'Newsletter', type: 'item', icon: 'mail', url: '/dashboard/admin/newsletter' },
    ],
  },
  {
    id: 'admin-content',
    title: 'Content',
    type: 'group',
    children: [
      { id: 'admin-success-stories', title: 'Success Stories', type: 'item', icon: 'trophy', url: '/dashboard/admin/success-stories' },
    ],
  },
  {
    id: 'admin-system',
    title: 'System (Super Admin)',
    type: 'group',
    children: [
      { id: 'admin-analytics', title: 'Analytics', type: 'item', icon: 'bar-chart', url: '/dashboard/admin/analytics' },
      { id: 'admin-logs', title: 'Audit Logs', type: 'item', icon: 'file-text', url: '/dashboard/admin/logs' },
      { id: 'admin-notification-settings', title: 'Notification Settings', type: 'item', icon: 'bell', url: '/dashboard/admin/settings/notifications' },
    ],
  },
];

// Normal Admin Menu — no delete, no logs, no admin creation
const adminMenuItems: MenuItem[] = [
  {
    id: 'admin-dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
      { id: 'admin-overview', title: 'Overview', type: 'item', icon: 'dashboard', url: '/dashboard/admin' },
    ],
  },
  {
    id: 'admin-directory',
    title: 'Directory',
    type: 'group',
    children: [
      { id: 'admin-browse-directory', title: 'Browse Directory', type: 'item', icon: 'search', url: '/directory' },
      { id: 'admin-favorites', title: 'Favorite Directory', type: 'item', icon: 'heart', url: '/dashboard/admin/favorites' },
    ],
  },
  {
    id: 'admin-management',
    title: 'Management',
    type: 'group',
    children: [
      { id: 'admin-users', title: 'Manage Users', type: 'item', icon: 'user', url: '/dashboard/admin/users' },
      { id: 'admin-business-verifications', title: 'Business Verifications', type: 'item', icon: 'building-check', url: '/dashboard/admin/business-verification' },
      { id: 'admin-products', title: 'Product Verifications', type: 'item', icon: 'package-check', url: '/dashboard/admin/products-management' },
      { id: 'admin-notification-settings', title: 'Notification Settings', type: 'item', icon: 'bell', url: '/dashboard/admin/settings/notifications' },
    ],
  },
  {
    id: 'admin-master-data-normal',
    title: 'Master Data',
    type: 'group',
    children: [
      { id: 'admin-master-data-page-normal', title: 'Industries & Sectors', type: 'item', icon: 'layers', url: '/dashboard/admin/master-data' },
    ],
  },
  {
    id: 'admin-communication',
    title: 'Communication',
    type: 'group',
    children: [
      { id: 'admin-inquiries', title: 'Inquiries', type: 'item', icon: 'help-circle', url: '/dashboard/admin/inquiries' },
    ],
  },
  {
    id: 'admin-content',
    title: 'Content',
    type: 'group',
    children: [
      { id: 'admin-success-stories', title: 'Success Stories', type: 'item', icon: 'trophy', url: '/dashboard/admin/success-stories' },
    ],
  },
  {
    id: 'admin-activity',
    title: 'Activity',
    type: 'group',
    children: [
      { id: 'admin-logs', title: 'My Activity Logs', type: 'item', icon: 'file-text', url: '/dashboard/admin/logs' },
    ],
  },
];

// Exporter Menu Items
const exporterMenuItems: MenuItem[] = [
  {
    id: 'exporter-dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
      {
        id: 'exporter-overview',
        title: 'Overview',
        type: 'item',
        icon: 'dashboard',
        url: '/dashboard/exporter',
      },
    ],
  },
  {
    id: 'exporter-directory',
    title: 'Directory',
    type: 'group',
    children: [
      {
        id: 'exporter-browse-directory',
        title: 'Browse Directory',
        type: 'item',
        icon: 'search',
        url: '/directory',
      },
    ],
  },
  {
    id: 'exporter-business',
    title: 'Business Management',
    type: 'group',
    children: [
      {
        id: 'exporter-profile',
        title: 'Business Profile',
        type: 'item',
        icon: 'building',
        url: '/dashboard/exporter/business-profile',
      },
      {
        id: 'exporter-products',
        title: 'Products',
        type: 'collapse',
        icon: 'package',
        children: [
          {
            id: 'exporter-products-list',
            title: 'My Products',
            type: 'item',
            icon: 'list',
            url: '/dashboard/exporter/products',
          },
          {
            id: 'exporter-products-add',
            title: 'Add Product',
            type: 'item',
            icon: 'plus',
            url: '/dashboard/exporter/add-product',
          },
        ],
      },
    ],
  },
  {
    id: 'exporter-communication',
    title: 'Communication',
    type: 'group',
    children: [
      {
        id: 'exporter-chat',
        title: 'Messages',
        type: 'item',
        icon: 'message-circle',
        url: '/dashboard/chat',
      },
    ],
  },
  {
    id: 'exporter-content',
    title: 'Content',
    type: 'group',
    children: [
      {
        id: 'exporter-success-stories',
        title: 'Success Stories',
        type: 'item',
        icon: 'star',
        url: '/dashboard/exporter/success-stories',
      },
    ],
  },
];

// Buyer Menu Items
const buyerMenuItems: MenuItem[] = [
  {
    id: 'buyer-dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
      {
        id: 'buyer-overview',
        title: 'Overview',
        type: 'item',
        icon: 'dashboard',
        url: '/dashboard/buyer',
      },
    ],
  },
  {
    id: 'buyer-sourcing',
    title: 'Sourcing',
    type: 'group',
    children: [
      {
        id: 'buyer-directory',
        title: 'Browse Directory',
        type: 'item',
        icon: 'search',
        url: '/directory',
      },
      {
        id: 'buyer-favorites',
        title: 'My Favorites',
        type: 'item',
        icon: 'heart',
        url: '/dashboard/buyer/favorites',
      },
    ],
  },
  {
    id: 'buyer-orders',
    title: 'Orders & Communication',
    type: 'group',
    children: [
      {
        id: 'buyer-chat',
        title: 'Messages',
        type: 'item',
        icon: 'message-circle',
        url: '/dashboard/chat',
      },
    ],
  },
  {
    id: 'buyer-content',
    title: 'Content',
    type: 'group',
    children: [
      {
        id: 'buyer-success-stories',
        title: 'Success Stories',
        type: 'item',
        icon: 'star',
        url: '/dashboard/buyer/success-stories',
      },
    ],
  },
];

// Common menu items for all roles (removed - no common items needed)
const commonMenuItems: MenuItem[] = [];

export function getMenuItemsForRole(role: UserRole, isSuperAdmin?: boolean): MenuItem[] {
  let roleMenuItems: MenuItem[] = [];

  const normalizedRole = role.toUpperCase() as 'ADMIN' | 'EXPORTER' | 'BUYER' | 'SUPER_ADMIN';

  switch (normalizedRole) {
    case 'ADMIN':
      roleMenuItems = isSuperAdmin ? superAdminMenuItems : adminMenuItems;
      break;
    case 'SUPER_ADMIN':
      roleMenuItems = superAdminMenuItems;
      break;
    case 'EXPORTER':
      roleMenuItems = exporterMenuItems;
      break;
    case 'BUYER':
      roleMenuItems = buyerMenuItems;
      break;
    default:
      roleMenuItems = buyerMenuItems;
  }

  return [...roleMenuItems, ...commonMenuItems];
}
