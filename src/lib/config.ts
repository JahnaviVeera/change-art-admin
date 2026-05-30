import { z } from 'zod';

/**
 * Zod-validated env reader. Throws at startup if any required `VITE_*`
 * variable is missing or malformed — fail-fast is preferable to runtime
 * "undefined is not a string" deep inside a hook.
 *
 * Note: only `VITE_*`-prefixed vars are reachable on the client. Server-side
 * secrets MUST NEVER be exposed here.
 */
const ConfigSchema = z.object({
  apiBaseUrl: z.string().url().default('http://localhost:3000'),
  wsUrl: z.string().url().default('http://localhost:3000'),
  authCookieName: z.string().min(1).default('better-auth.session_token'),

  firebase: z.object({
    apiKey: z.string().optional(),
    authDomain: z.string().optional(),
    projectId: z.string().optional(),
    storageBucket: z.string().optional(),
    messagingSenderId: z.string().optional(),
    appId: z.string().optional(),
    vapidKey: z.string().optional(),
  }),

  uploadChunkSizeBytes: z.coerce.number().int().positive().default(5_242_880),

  defaultCurrency: z.string().length(3).default('INR'),
  defaultLocale: z.string().min(2).default('en-IN'),
  appName: z.string().min(1).default('Creative Production Platform'),

  isDev: z.boolean(),
  isProd: z.boolean(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

const raw = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  authCookieName: import.meta.env.VITE_AUTH_COOKIE_NAME,

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
  },

  uploadChunkSizeBytes: import.meta.env.VITE_UPLOAD_CHUNK_SIZE_BYTES,

  defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY,
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE,
  appName: import.meta.env.VITE_APP_NAME,

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

const parsed = ConfigSchema.safeParse(raw);

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  console.error('Invalid environment configuration:', fieldErrors);
  throw new Error(
    'Invalid environment configuration. See console for details and check your .env file against .env.example.',
  );
}

export const config: AppConfig = parsed.data;

if (import.meta.env.DEV) {
  // Print the resolved URLs once so a misconfigured .env is obvious in the
  // console (the symptom otherwise is a silent retry loop in the WS tab).
  console.info('[config] apiBaseUrl =', config.apiBaseUrl);
  console.info('[config] wsUrl      =', config.wsUrl);
}

/** Whether Firebase Cloud Messaging is fully configured. */
export const isFcmConfigured: boolean = Boolean(
  config.firebase.apiKey &&
    config.firebase.authDomain &&
    config.firebase.projectId &&
    config.firebase.appId &&
    config.firebase.messagingSenderId &&
    config.firebase.vapidKey,
);
