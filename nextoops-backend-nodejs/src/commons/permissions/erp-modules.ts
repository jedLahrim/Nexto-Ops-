/**
 * Module permission catalog (v12.1 — full admin control).
 *
 * The admin decides exactly what each user and each permission set contains.
 * There are NO forced modules: a set can be empty, and every module —
 * including the admin-reserved ones — can be included in or excluded from any
 * set. Only the admin role itself bypasses the list entirely.
 *
 * This catalog defines the 19 modules; permission sets (including the seeded
 * built-ins) live in the database and are fully editable by the admin.
 */

export const ERP_MODULES = [
  {
    key: 'dashboard',
    label: 'Overview',
    description: 'Personal & IT-wide KPIs, attention list',
  },
  {
    key: 'org',
    label: 'Departments & rooms',
    description: 'School structure, rooms, report an issue',
  },
  {
    key: 'incidents',
    label: 'Incidents',
    description: 'Ticket queue, assign, resolve, SLA',
  },
  {
    key: 'problems',
    label: 'Problems',
    description: 'Root-cause records linked to incidents',
  },
  {
    key: 'changes',
    label: 'Changes',
    description: 'Change requests and approvals',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Assets: PCs, projectors, transfers, bulk create',
  },
  {
    key: 'stock',
    label: 'Stock',
    description: 'Consumables, requests, school-wide asset overview',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    description: 'Schedules and service records',
  },
  {
    key: 'vendors',
    label: 'Vendors',
    description: 'Supplier master data',
  },
  {
    key: 'procurement',
    label: 'Procurement',
    description: 'Purchase requisitions and orders',
  },
  {
    key: 'contracts',
    label: 'Contracts',
    description: 'Vendor contracts and expiry alerts',
  },
  {
    key: 'licenses',
    label: 'Licenses',
    description: 'Software licenses and seat counts',
  },
  {
    key: 'risks',
    label: 'Risks',
    description: 'Risk register (ISO 31000 aligned)',
  },
  {
    key: 'budget',
    label: 'Budget',
    description: 'Annual IT budget plan',
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'KPI reports and exports',
  },
  {
    key: 'powerbi',
    label: 'Power BI',
    description: 'BI connection guide and star schema',
  },
  {
    key: 'docs',
    label: 'Docs',
    description: 'Built-in handbook',
  },
  {
    key: 'users',
    label: 'Users',
    description: 'Accounts, roles, permissions (admin-managed)',
    adminManaged: true,
  },
  {
    key: 'audit',
    label: 'Audit log',
    description: 'Immutable action history',
    adminManaged: true,
  },
] as const;

export type ErpModuleKey = (typeof ERP_MODULES)[number]['key'];

export const ERP_MODULE_KEYS = ERP_MODULES.map((m) => m.key) as ErpModuleKey[];

export function isValidErpModule(key: string): boolean {
  return (ERP_MODULE_KEYS as string[]).includes(key);
}

/** Normalize an arbitrary array to valid unique module keys. */
export function normalizeErpModules(list: unknown): ErpModuleKey[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: ErpModuleKey[] = [];
  for (const item of list) {
    if (typeof item === 'string' && isValidErpModule(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item as ErpModuleKey);
    }
  }
  return out;
}
