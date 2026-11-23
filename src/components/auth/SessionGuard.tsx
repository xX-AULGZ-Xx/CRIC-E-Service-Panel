'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const wasLoggedInRef = useRef<boolean>(false);
  const lastRoleRef = useRef<string | null>(null);
  const lastProfileRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't run session guard on install screens
    if (pathname === '/install' || pathname?.startsWith('/install')) {
      return;
    }

    // Reset transition lock on route change
    isTransitioningRef.current = false;

    // Check initial session state
    const loggedInCookie = getCookie('cric_logged_in');
    const ssoCookie = getCookie('cric_sso_session');
    const hasActiveSession = loggedInCookie === 'true' || !!ssoCookie;

    wasLoggedInRef.current = hasActiveSession;
    lastRoleRef.current = getCookie('cric_active_role');
    lastProfileRef.current = getCookie('cric_user_profile');

    const triggerSoftSync = () => {
      window.dispatchEvent(new CustomEvent('cric:session-updated'));
      router.refresh();
    };

    const handleLoggedIn = () => {
      if (isTransitioningRef.current) return;
      wasLoggedInRef.current = true;
      lastRoleRef.current = getCookie('cric_active_role');
      lastProfileRef.current = getCookie('cric_user_profile');

      if (pathname === '/login') {
        isTransitioningRef.current = true;
        window.location.href = '/';
      } else {
        triggerSoftSync();
      }
    };

    const handleLoggedOut = () => {
      if (isTransitioningRef.current) return;
      if (pathname === '/login') return;
      if (wasLoggedInRef.current) {
        isTransitioningRef.current = true;
        wasLoggedInRef.current = false;
        window.location.href = '/login?expired=1';
      }
    };

    const handleSessionChange = () => {
      if (isTransitioningRef.current) return;
      lastRoleRef.current = getCookie('cric_active_role');
      lastProfileRef.current = getCookie('cric_user_profile');
      triggerSoftSync();
    };

    // 1. Cross-tab communication via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('cric_sso_channel');
        channel.onmessage = (event) => {
          const type = event.data?.type;
          if (type === 'LOGOUT') {
            handleLoggedOut();
          } else if (type === 'LOGIN' || type === 'SSO_LOGIN') {
            handleLoggedIn();
          } else if (type === 'ROLE_CHANGE') {
            handleSessionChange();
          }
        };
      }
    } catch (e) {
      console.error('[Session Guard] BroadcastChannel init error:', e);
    }

    // 2. Storage event listener (fallback across same-origin tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cric_sso_logout_event') {
        handleLoggedOut();
      } else if (e.key === 'cric_sso_login_event') {
        handleLoggedIn();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Check cookies directly (runs on focus / visible / polling)
    const verifySessionCookies = () => {
      if (isTransitioningRef.current) return;

      const currentLoggedIn = getCookie('cric_logged_in') === 'true' || !!getCookie('cric_sso_session');
      const currentRole = getCookie('cric_active_role');
      const currentProfile = getCookie('cric_user_profile');

      // Case A: Was guest, now logged in
      if (!wasLoggedInRef.current && currentLoggedIn) {
        handleLoggedIn();
        return;
      }

      // Case B: Was logged in, now logged out
      if (wasLoggedInRef.current && !currentLoggedIn) {
        handleLoggedOut();
        return;
      }

      // Case C: Role or Profile changed while logged in
      if (wasLoggedInRef.current && currentLoggedIn) {
        if (lastRoleRef.current !== null && currentRole && currentRole !== lastRoleRef.current) {
          handleSessionChange();
          return;
        }
        if (lastProfileRef.current !== null && currentProfile && currentProfile !== lastProfileRef.current) {
          handleSessionChange();
          return;
        }
      }
    };

    // 4. On window focus & visibility change (only when tab becomes visible)
    const handleFocus = () => verifySessionCookies();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySessionCookies();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Periodic polling interval (every 5 seconds)
    const interval = setInterval(verifySessionCookies, 5000);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
