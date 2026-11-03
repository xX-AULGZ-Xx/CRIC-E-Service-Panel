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

  useEffect(() => {
    // Don't run session guard on login or install screens
    if (pathname === '/login' || pathname === '/install' || pathname?.startsWith('/install')) {
      return;
    }

    // Check if user is currently logged in on initial load
    const loggedInCookie = getCookie('cric_logged_in');
    const ssoCookie = getCookie('cric_sso_session');
    
    // User is considered authenticated if cric_logged_in is true or cric_sso_session exists
    const hasActiveSession = loggedInCookie === 'true' || !!ssoCookie;
    
    if (hasActiveSession) {
      wasLoggedInRef.current = true;
    }

    const handleLoggedOut = () => {
      if (wasLoggedInRef.current) {
        console.warn('[Session Guard] Central SSO session has been terminated by another app. Redirecting to login...');
        wasLoggedInRef.current = false;
        window.location.href = '/login?expired=1';
      }
    };

    // 1. Cross-tab communication via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('cric_sso_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            handleLoggedOut();
          }
        };
      }
    } catch (e) {
      console.error('[Session Guard] BroadcastChannel init error:', e);
    }

    // 2. Storage event listener (as fallback across same-origin tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cric_sso_logout_event') {
        handleLoggedOut();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Check cookies directly
    const verifySessionCookies = () => {
      if (!wasLoggedInRef.current) return;

      const currentLoggedIn = getCookie('cric_logged_in');
      const currentSso = getCookie('cric_sso_session');

      if (!currentLoggedIn && !currentSso) {
        handleLoggedOut();
      }
    };

    // 4. On window focus & visibility change (check immediately when user switches back to Panel tab)
    const handleFocus = () => {
      verifySessionCookies();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySessionCookies();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Light polling interval (every 4 seconds)
    const interval = setInterval(verifySessionCookies, 4000);

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
