import { randomBytes } from 'crypto';

/** Short, sortable-ish, collision-resistant id. Not a real cuid — no need
 * for the extra dependency — just prefix + random hex, which is all these
 * primary keys need. */
export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}
