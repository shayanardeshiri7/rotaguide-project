# ADR 0002 — Local-first storage, with cloud backup as strictly opt-in

**Status:** Accepted
**Date:** 2026-08-30

## Context

The tracker stores where and when someone injected insulin. That is health data about an identifiable person, and it is the kind of record that is uninteresting until the moment it is not — an insurer, an employer, or a data breach can each turn it into a problem for the person who generated it.

The project's own style guide, written before any of this was built, commits to: _never transmit injection data off-device without explicit user consent._ The FMEA and ethics analysis both treat unwanted disclosure as a real harm rather than a compliance checkbox.

At the same time, there is a genuine user need behind cloud sync. Losing a year of injection history because a phone was replaced or browser storage was cleared is a real cost, and the v1 app had exactly that failure mode with no recourse.

There is also an honest secondary motivation: a backend demonstrates full-stack range in a portfolio. That is a legitimate reason to build something, but it is not a legitimate reason to move someone's health data, and the design has to reflect that ordering.

## Decision

**The app is local-first. Cloud backup exists, is off by default, and is never a prerequisite for anything.**

Concretely:

1. **Every feature works with sync off.** Sync adds durability across devices. It adds no capability. A user who never enables it is not using a degraded version of the app.
2. **Storage is IndexedDB**, via Zustand's persist middleware. Everything read back is validated with Zod before it reaches the store, because persisted state is the only untrusted input this app has.
3. **Enabling sync requires passing a consent screen** that states in plain language which fields are transmitted (region, zone, timestamp) and which never are (name, date of birth, glucose readings, doses). It is not a checkbox next to a link to a policy.
4. **Auth is magic-link only.** No passwords to store or leak, and no OAuth provider handed a profile we have no use for.
5. **Row Level Security on the table, forced, with policies in version control** (`supabase/migrations/`) so they can be reviewed rather than trusted. `anon` is explicitly revoked.
6. **The schema stores the minimum.** No name, no date of birth, no glucose values, no dose amounts, no device identifiers. If a column is not needed to compute a rotation recommendation, it does not exist.
7. **Export and delete are one button each.** Deleting the cloud copy leaves the on-device history untouched, and says so.
8. **The Supabase client is dynamically imported** and excluded from the offline precache. A local-only user does not download 218 KB for a feature they never turn on.

## Consequences

**Good.** The privacy claim on the marketing site is true, which matters because that site also has an ethics section — a default-on sync would have made it a lie. Sync being genuinely optional means the app has no server dependency, no uptime risk, and no ongoing cost. The RLS policies being reviewable in the repo is a stronger statement than asserting the data is secure.

**Costs.** Sync is more work this way than sync-by-default: two storage paths to keep coherent, a merge strategy, and a consent flow to design and maintain. Adoption will be low, because defaults dominate — which is the correct outcome here, but it does mean the backend is exercised less than it would otherwise be.

**Conflict resolution is deliberately trivial.** Entries are immutable once written, so last-write-wins per entry `id` cannot lose information: two rows sharing an id carry identical content. This is a property of the data model, not a heuristic, and it is why no CRDT or vector clock is warranted.

## Alternatives considered

**Sync on by default with an opt-out.** Rejected. It contradicts a written project commitment, and "we made it easy to turn off" is not consent.

**No backend at all.** Tempting, and it was the v1 behaviour. Rejected because history loss on device change is a real user harm, and the constraint could be met honestly rather than by avoiding the problem.

**End-to-end encryption of the payload.** Attractive, and it would let the server hold data it cannot read. Rejected for this iteration: key management on a device someone might lose is a hard problem, and getting it subtly wrong would be worse than the current design, which simply stores very little. Worth revisiting.
