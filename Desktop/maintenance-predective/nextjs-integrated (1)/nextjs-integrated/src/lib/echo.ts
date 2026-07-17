import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: Echo<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEcho(): Echo<any> {
  if (typeof window === 'undefined') throw new Error('Echo is client-only');
  if (echoInstance) return echoInstance;

  // Enable Pusher wire-level logs in dev so the browser console shows every
  // WS frame and auth call — invaluable for debugging connection issues.
  if (process.env.NODE_ENV === 'development') {
    Pusher.logToConsole = true;
  }

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 6001),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 6001),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/api/broadcasting/auth',
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
