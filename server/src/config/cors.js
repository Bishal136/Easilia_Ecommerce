/**
 * CORS Configuration and Origin Validator
 * Parses allowed origins from environment variables (CORS_ORIGIN, CLIENT_URL)
 * Normalizes trailing slashes, supports comma-separated domains, and handles wildcards.
 */

/**
 * Returns an array of normalized allowed origins from environment variables.
 * @returns {string[]}
 */
export const getAllowedOrigins = () => {
  const origins = new Set();

  // 1. Process CORS_ORIGIN (.env)
  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) {
        // Strip trailing slashes unless it is a single wildcard '*'
        origins.add(trimmed === '*' ? '*' : trimmed.replace(/\/+$/, ''));
      }
    });
  }

  // 2. Process CLIENT_URL (.env)
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) {
        origins.add(trimmed === '*' ? '*' : trimmed.replace(/\/+$/, ''));
      }
    });
  }

  // 3. Fallbacks for local development
  if (process.env.NODE_ENV !== 'production' || origins.size === 0) {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:5174');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://127.0.0.1:5174');
    origins.add('http://127.0.0.1:3000');
  }

  return Array.from(origins);
};

/**
 * Checks if a given request origin is permitted by the CORS rules.
 * @param {string|undefined} origin - Request origin header (e.g. 'https://domain.com')
 * @returns {boolean}
 */
export const isOriginAllowed = (origin) => {
  // Allow requests without Origin header (mobile apps, server-to-server, curl, Postman)
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();

  // Allow all origins if wildcard '*' is explicitly defined
  if (allowedOrigins.includes('*')) {
    return true;
  }

  const cleanOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    const cleanAllowed = allowed.replace(/\/+$/, '').toLowerCase();
    return cleanAllowed === cleanOrigin;
  });
};

/**
 * Express CORS Middleware Options
 */
export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      // Dynamic origin mirroring allows credentials (cookies, authorization headers)
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not allowed by CORS_ORIGIN or CLIENT_URL`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours preflight cache
};

export default corsOptions;
