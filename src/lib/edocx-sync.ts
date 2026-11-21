/**
 * Non-blocking push sync helper to notify CRIC E-Docx immediately
 * when users are created, updated, deleted, or imported in CRIC E-Service Panel.
 */
export async function syncUsersToEdocx(
  action: 'upsert' | 'delete',
  users: any[]
): Promise<void> {
  if (!Array.isArray(users) || users.length === 0) return;

  const syncSecret = process.env.PANEL_SYNC_SECRET || 'cric-panel-sync-secret-2026';
  const candidateUrls = [
    process.env.EDOCX_API_URL,
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3030',
    'https://edocx.cric.ac.th',
  ].filter(Boolean) as string[];

  const payload = JSON.stringify({
    action,
    source: 'panel',
    users,
  });

  for (const baseUrl of candidateUrls) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    try {
      const res = await fetch(`${cleanBase}/v1/auth/webhooks/user-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRIC-SYNC-KEY': syncSecret,
        },
        body: payload,
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return;
      }
    } catch {
      // Try next candidate URL
    }
  }
}
