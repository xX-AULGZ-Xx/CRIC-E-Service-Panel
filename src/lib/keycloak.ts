export function getKeycloakPublicUrl(req?: { headers: { get: (name: string) => string | null } }): string {
  // 1. Explicit environment variable for public URL
  if (process.env.KEYCLOAK_PUBLIC_URL) {
    return process.env.KEYCLOAK_PUBLIC_URL.replace(/\/$/, '');
  }

  // 2. Dynamic check based on request host
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    if (host.includes('cric.ac.th')) {
      return 'https://sso.cric.ac.th';
    }
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'http://localhost:8085';
    }
  }

  // 3. Fallback to KEYCLOAK_URL if not an internal Docker container name
  const envUrl = process.env.KEYCLOAK_URL;
  if (envUrl && !envUrl.includes('keycloak:')) {
    return envUrl.replace(/\/$/, '');
  }

  // 4. Production institutional SSO domain
  return 'https://sso.cric.ac.th';
}

export function getKeycloakInternalUrl(): string {
  // Server-to-server internal fetch inside Docker network
  if (process.env.KEYCLOAK_INTERNAL_URL) {
    return process.env.KEYCLOAK_INTERNAL_URL.replace(/\/$/, '');
  }
  if (process.env.KEYCLOAK_URL) {
    return process.env.KEYCLOAK_URL.replace(/\/$/, '');
  }
  return 'https://sso.cric.ac.th';
}
