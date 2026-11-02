import { roleAtLeast } from '../shared/services/permissionService.js';

/**
 * `authorize` middleware factory.
 *
 * Usage:
 *   router.get('/private', authorize({ roles: ['admin', 'owner'] }), handler)
 *   router.get('/workspace/:wid', authorize({ workspaceRole: 'member' }), handler)
 *   router.get('/projects/:pid', authorize({ projectRole: 'member' }), handler)
 *
 * Role resolution must come from the DB, never from the request body. The
 * middleware is intentionally thin — the actual membership lookup happens in
 * per-route middleware that attaches `req.membership` / `req.projectMembership`.
 */
export function authorize({ roles = null, workspaceRole = null, projectRole = null } = {}) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const membership = req.membership || {};
    const projectMembership = req.projectMembership || {};

    if (roles) {
      const userRole = membership.role;
      if (!userRole || !roles.some((r) => roleAtLeast(userRole, r))) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }
    }

    if (workspaceRole) {
      const userRole = membership.role;
      if (!userRole || !roleAtLeast(userRole, workspaceRole)) {
        return res.status(403).json({ error: 'Forbidden: insufficient workspace role' });
      }
    }

    if (projectRole) {
      const userRole = projectMembership?.role;
      if (!userRole || !roleAtLeast(userRole, projectRole)) {
        return res.status(403).json({ error: 'Forbidden: insufficient project role' });
      }
    }

    return next();
  };
}

export default authorize;