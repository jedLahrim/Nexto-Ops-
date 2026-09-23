/**
 * ITSM ticket lifecycle (v12).
 *
 * State machine (per the ITSM breakdown):
 *
 *   new ──assign──► assigned ──start──► in_progress ──resolve──► resolved
 *     │                  │                   │                       │
 *     │                  │                   └──hold──► on_hold ──┘   │
 *     │                  └──resolve───────────┘                       │
 *     └──resolve (no assignee yet: straight to resolved)─────────────►│
 *                                                                     │
 *   resolved ──close──► closed ◄──close── resolved                    │
 *      ▲                                                              │
 *      └── reopen (requester says it's NOT fixed) ◄── closed/resolved │
 *
 * Rules enforced by `canTransition`:
 *  - Tickets are only closed by an admin after resolution.
 *  - Resolved/closed tickets can be reopened (reopenCount increments).
 *  - on_hold is only reachable from assigned/in_progress (waiting on vendor,
 *    parts, user…). Reopening from on_hold returns to in_progress.
 */

export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';

/** Legal transitions: from → set of allowed next statuses. */
export const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ['assigned', 'resolved', 'closed'],
  assigned: ['in_progress', 'on_hold', 'resolved', 'closed'],
  in_progress: ['on_hold', 'resolved', 'closed'],
  on_hold: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

/** Actions a non-admin REPORTER may take on their own ticket. */
export function reporterAllowedActions(status: TicketStatus): Array<'verify' | 'reopen' | 'none'> {
  if (status === 'resolved') return ['verify', 'reopen'];
  if (status === 'closed') return ['reopen'];
  return ['none'];
}

export type TransitionError = 'NOT_FOUND' | 'ILLEGAL_TRANSITION' | 'RESOLVE_NEEDS_NOTES' | 'CLOSE_NEEDS_NOTES';

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/** Human-readable label for a status, matching the ITSM lifecycle names. */
export function statusLabel(status: string): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'Work in progress';
    case 'on_hold':
      return 'Pending / on hold';
    case 'resolved':
      return 'Resolved — awaiting your confirmation';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
}
