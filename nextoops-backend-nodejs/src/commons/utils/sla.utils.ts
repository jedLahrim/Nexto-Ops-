/**
 * SLA policy (v8) — internal service targets per incident priority.
 *
 * These are organizational targets, not contractual ones: they model the
 * common enterprise tiering (P1 restore fastest, planning items have no
 * clock). ISO 20000-1 asks that service levels are *defined and measured*;
 * the numbers below are defaults the org can tune in one place.
 */

export const SLA_TARGETS: Record<string, number> = {
  critical: 4, // hours to resolve
  high: 8,
  medium: 24,
  low: 72,
  // "planning" — no clock; it is not a service interruption.
};

export const SLA_TARGET_ORDER = ['critical', 'high', 'medium', 'low', 'planning'];

export function slaTargetHours(priority: string): number | null {
  return SLA_TARGETS[priority] ?? null;
}

export type SlaState = 'on_track' | 'at_risk' | 'breached' | 'met' | 'none';

/**
 * SLA state for one incident at a point in time.
 *  - open ticket: on_track (>25% time left), at_risk (<=25% left), breached
 *  - resolved/closed ticket: met if resolved within target, breached if not
 *  - no target (planning): none
 */
export function slaState(input: {
  priority: string;
  status: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  now?: Date;
}): SlaState {
  const target = slaTargetHours(input.priority);
  if (target === null) return 'none';
  const now = input.now ?? new Date();
  const deadline = new Date(input.createdAt.getTime() + target * 3_600_000);
  if (input.status === 'resolved' || input.status === 'closed') {
    if (!input.resolvedAt) return 'none';
    return input.resolvedAt <= deadline ? 'met' : 'breached';
  }
  if (now >= deadline) return 'breached';
  const remaining = deadline.getTime() - now.getTime();
  const total = target * 3_600_000;
  return remaining <= total * 0.25 ? 'at_risk' : 'on_track';
}

/** Human label for a SLA state. */
export function slaLabel(state: SlaState): string {
  switch (state) {
    case 'on_track':
      return 'On track';
    case 'at_risk':
      return 'At risk';
    case 'breached':
      return 'Breached';
    case 'met':
      return 'Met';
    default:
      return '—';
  }
}
