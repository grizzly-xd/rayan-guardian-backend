import { Errors } from '../utils/errors.js';

/**
 * Restricts access to active admin accounts.
 * Roles supported: "owner" and "admin". The seed script assigns "owner".
 * Any future role expansion must be explicitly whitelisted here.
 */
const ALLOWED_ROLES = new Set(['owner', 'admin']);

export function requireAdmin(req, _res, next) {
  if (!req.admin) return next(Errors.unauthorized());
  if (!ALLOWED_ROLES.has(req.admin.role)) {
    return next(Errors.forbidden('Admin role required'));
  }
  next();
}
