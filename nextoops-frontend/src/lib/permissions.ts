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

export const MODULES = [
  {
    key: "dashboard",
    label: "Overview",
    description: "Personal & IT-wide KPIs, attention list",
  },
  {
    key: "org",
    label: "Departments & rooms",
    description: "School structure, rooms, report an issue",
  },
  {
    key: "incidents",
    label: "Incidents",
    description: "Ticket queue, assign, resolve, SLA",
  },
  {
    key: "problems",
    label: "Problems",
    description: "Root-cause records linked to incidents",
  },
  {
    key: "changes",
    label: "Changes",
    description: "Change requests and approvals",
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Assets: PCs, projectors, transfers, bulk create",
  },
  {
    key: "stock",
    label: "Stock",
    description: "Consumables, requests, school-wide asset overview",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Schedules and service records",
  },
  {
    key: "vendors",
    label: "Vendors",
    description: "Supplier master data",
  },
  {
    key: "procurement",
    label: "Procurement",
    description: "Purchase requisitions and orders",
  },
  {
    key: "contracts",
    label: "Contracts",
    description: "Vendor contracts and expiry alerts",
  },
  {
    key: "licenses",
    label: "Licenses",
    description: "Software licenses and seat counts",
  },
  {
    key: "risks",
    label: "Risks",
    description: "Risk register (ISO 31000 aligned)",
  },
  {
    key: "budget",
    label: "Budget",
    description: "Annual IT budget plan",
  },
  {
    key: "reports",
    label: "Reports",
    description: "KPI reports and exports",
  },
  {
    key: "powerbi",
    label: "Power BI",
    description: "BI connection guide and star schema",
  },
  {
    key: "docs",
    label: "Docs",
    description: "Built-in handbook",
  },
  {
    key: "users",
    label: "Users",
    description: "Accounts, roles, permissions (admin-managed)",
    adminManaged: true,
  },
  {
    key: "audit",
    label: "Audit log",
    description: "Immutable action history",
    adminManaged: true,
  },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];

export function isValidModule(key: string): boolean {
  return (MODULE_KEYS as string[]).includes(key);
}

/**
 * Seed definitions for the built-in permission sets. They are inserted into
 * the permissionSets table on first use and from then on behave like any
 * other set: the admin can rename, edit, or delete them.
 */
export const PRESETS: Record<string, { label: string; description: string; modules: ModuleKey[] }> = {
  staff: {
    label: "Staff / Teacher",
    description: "Report issues, follow their tickets",
    modules: ["dashboard", "org"],
  },
  stock_manager: {
    label: "Store / Stock keeper",
    description: "Everything stock: receive, issue, fulfil requests, overview",
    modules: ["dashboard", "org", "stock", "inventory"],
  },
  technician: {
    label: "IT Technician",
    description: "Work tickets, assets, maintenance — no finance",
    modules: ["dashboard", "org", "inventory", "incidents", "problems", "changes", "maintenance", "reports"],
  },
  procurement: {
    label: "Procurement officer",
    description: "Vendors, purchasing, contracts, licenses, budget",
    modules: ["dashboard", "vendors", "procurement", "contracts", "licenses", "budget"],
  },
  manager: {
    label: "Manager / Head",
    description: "Full visibility + reports and Power BI, no admin",
    modules: MODULE_KEYS.filter((k) => k !== "users" && k !== "audit"),
  },
  custom: {
    label: "Custom",
    description: "Pick modules one by one",
    modules: [],
  },
};

/** Normalize an arbitrary array to valid unique module keys. */
export function normalizeModules(list: unknown): ModuleKey[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: ModuleKey[] = [];
  for (const item of list) {
    if (typeof item === "string" && isValidModule(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item as ModuleKey);
    }
  }
  return out;
}


