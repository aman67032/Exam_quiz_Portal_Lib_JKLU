/**
 * Keep-alive service to prevent Railway backend from spinning down
 * Pings the backend health endpoint every 5 minutes to keep it active
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://learnjklu-backend.vercel.app';

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
let isActive = false;

/**
 * Start the keep-alive service
 * Pings the backend every 5 minutes (300 seconds) to prevent spin-down
 * Railway free tier may spin down after inactivity
 */
export const startKeepAlive = () => {
  if (isActive) {
    console.log('Keep-alive service already running');
    return;
  }

  console.log('🚀 Starting keep-alive service for backend...');
  isActive = true;

  // Ping immediately on start
  pingBackend();

  // Then ping every 5 minutes (300000ms)
  // This ensures backend stays awake (Railway may spin down after inactivity)
  keepAliveInterval = setInterval(() => {
    pingBackend();
  }, 5 * 60 * 1000); // 5 minutes
};

/**
 * Stop the keep-alive service
 */
export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    isActive = false;
    console.log('Keep-alive service stopped');
  }
};

/**
 * Ping the backend health endpoint
 */
const pingBackend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't wait too long - if backend is sleeping, it will wake up
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Backend keep-alive ping successful:', data.status);
    } else {
      console.warn('⚠️ Backend health check returned non-OK status:', response.status);
    }
  } catch (error: any) {
    // If backend is sleeping, the request will fail/timeout
    // That's okay - the request itself wakes up the backend
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.log('⏳ Backend is waking up (timeout expected)...');
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.log('⏳ Backend is waking up (connection error expected)...');
    } else {
      console.warn('⚠️ Keep-alive ping error:', error.message);
    }
  }
};

/**
 * Wake up the backend immediately (useful when user visits the site)
 */
export const wakeUpBackend = async (): Promise<boolean> => {
  try {
    // Try the wake endpoint first (faster)
    const wakeResponse = await fetch(`${API_BASE_URL}/wake`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000), // 30 second timeout for cold start
    });

    if (wakeResponse.ok) {
      console.log('✓ Backend woke up successfully');
      return true;
    }
  } catch (error: any) {
    // If wake endpoint fails, try health endpoint
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30 second timeout for cold start
      });

      if (healthResponse.ok) {
        console.log('✓ Backend woke up via health endpoint');
        return true;
      }
    } catch (healthError) {
      console.warn('⚠️ Backend wake-up failed:', error.message);
      return false;
    }
  }

  return false;
};

