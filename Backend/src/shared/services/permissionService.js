/**
 * Centralized authorization service.
 *
 * Roles are server-defined constants. A client-supplied role string is NEVER
 * trusted; lookups always resolve the role from the stored workspace member
 * record.
 */
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  MEMBER: 'member',
  GUEST: 'guest',
};

export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.PROJECT_MANAGER]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.GUEST]: 1,
};

/**
 * Returns true if the given role is at least `requiredRole`.
 */
export function roleAtLeast(role, requiredRole) {
  const a = ROLE_HIERARCHY[role] ?? 0;
  const b = ROLE_HIERARCHY[requiredRole] ?? 0;
  return a >= b;
}

/**
 * Permission checks are intentionally simple and centralized.
 * Add more granular checks here as the product grows.
 */
export const PERMISSIONS = {
  MANAGE_WORKSPACE: 'workspace:manage',
  MANAGE_MEMBERS: 'workspace:members',
  MANAGE_PROJECTS: 'workspace:projects',
  CREATE_CHANNEL: 'workspace:channels',
  CREATE_PROJECT: 'workspace:create_project',
  EDIT_ISSUE: 'issue:edit',
  DELETE_ISSUE: 'issue:delete',
  MANAGE_BOARD: 'board:manage',
};

export default { ROLES, ROLE_HIERARCHY, roleAtLeast, PERMISSIONS };