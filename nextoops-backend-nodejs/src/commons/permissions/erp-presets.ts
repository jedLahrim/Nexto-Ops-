import { ErpModuleKey, ERP_MODULE_KEYS } from './erp-modules';

/**
 * Seed definitions for the built-in permission sets. They are inserted into
 * the permissionSets table on first use and from then on behave like any
 * other set: the admin can rename, edit, or delete them.
 */
export const ERP_PRESETS: Record<string, { label: string; description: string; modules: ErpModuleKey[] }> = {
  staff: {
    label: 'Staff / Teacher',
    description: 'Report issues, follow their tickets',
    modules: ['dashboard', 'org'],
  },
  stock_manager: {
    label: 'Store / Stock keeper',
    description: 'Everything stock: receive, issue, fulfil requests, overview',
    modules: ['dashboard', 'org', 'stock', 'inventory'],
  },
  technician: {
    label: 'IT Technician',
    description: 'Work tickets, assets, maintenance — no finance',
    modules: ['dashboard', 'org', 'inventory', 'incidents', 'problems', 'changes', 'maintenance', 'reports'],
  },
  procurement: {
    label: 'Procurement officer',
    description: 'Vendors, purchasing, contracts, licenses, budget',
    modules: ['dashboard', 'vendors', 'procurement', 'contracts', 'licenses', 'budget'],
  },
  manager: {
    label: 'Manager / Head',
    description: 'Full visibility + reports and Power BI, no admin',
    modules: ERP_MODULE_KEYS.filter((k) => k !== 'users' && k !== 'audit'),
  },
  custom: {
    label: 'Custom',
    description: 'Pick modules one by one',
    modules: [],
  },
};
