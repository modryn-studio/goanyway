// Single source of truth for the app's basePath.
// Must match basePath in next.config.ts.
// Use this for all fetch() calls to API routes — Next.js does NOT auto-prefix
// raw fetch() with the basePath (only Link and useRouter get it automatically).
export const BASE_PATH = '/tools/goanyway';
