// Cookie names for the two audiences. The current Vite frontend never reads or
// writes these itself — the backend sets them HttpOnly and the browser attaches
// them automatically. We keep the names here only for documentation and for any
// deliberate cookie inspection; the frontend never PARSES the JWT (locked rule).
//
// C9 (multi-tenant safety): both cookies may be present in a single request. On
// the server we forward the ENTIRE cookie jar (see server-fetch.ts) and let the
// backend authorize per route — an employer endpoint validates jm_employer_token
// and ignores tj_token, and vice-versa. We do NOT strip cookies because the
// backend is the single source of truth for which token authorizes which route.
export const SEEKER_COOKIE_NAME = 'tj_token';
export const EMPLOYER_COOKIE_NAME = 'jm_employer_token';
// Admin audience (feat/admin-identity). httpOnly, backend-set (8h TTL). Documented
// here only — the client never reads or parses it; admin auth state comes from
// GET /api/admin/auth/me.
export const ADMIN_COOKIE_NAME = 'jm_admin_token';
