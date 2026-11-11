/**
 * Formats a stored username as a clean `@username` handle for UI display,
 * stripping any email domain suffix (e.g. `darunee@cric.ac.th` -> `@darunee`)
 * while leaving the underlying database username unchanged.
 */
export function formatUsernameHandle(username?: string | null): string {
  const cleaned = String(username || '')
    .trim()
    .replace(/^@+/, '')
    .split('@')[0]
    .trim();
  return cleaned ? `@${cleaned}` : '-';
}
