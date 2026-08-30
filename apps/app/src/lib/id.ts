/**
 * Entry ids.
 *
 * Ids must be stable and collision-free across devices, because they are
 * the conflict-resolution key for optional sync (entries are immutable
 * once written, so last-write-wins per id is safe by construction).
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Older webviews: timestamp prefix keeps ids roughly sortable, random
  // suffix makes a collision within the same millisecond implausible.
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
}
