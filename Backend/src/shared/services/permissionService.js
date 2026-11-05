/**
 * Centralized authorization service.
 *
 * Roles are server-defined constants. A client-supplied role string is NEVER
 * trusted; lookups always resolve the role from the stored workspace member
 * record.
 */
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  MEMBER: "member",
  GUEST: "guest",
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
  MANAGE_WORKSPACE: "workspace:manage",
  MANAGE_MEMBERS: "workspace:members",
  MANAGE_PROJECTS: "workspace:projects",
  CREATE_CHANNEL: "workspace:channels",
  CREATE_PROJECT: "workspace:create_project",
  EDIT_ISSUE: "issue:edit",
  DELETE_ISSUE: "issue:delete",
  MANAGE_BOARD: "board:manage",
};

export function canManageWorkspace(role) {
  return roleAtLeast(role, ROLES.ADMIN);
}

export function canManageMemberRole(actorRole, targetRole) {
  if (![ROLES.OWNER, ROLES.ADMIN].includes(actorRole)) return false;
  if (targetRole === ROLES.OWNER) return false;
  return actorRole === ROLES.OWNER || targetRole !== ROLES.ADMIN;
}

export function canCreateProject(workspaceRole) {
  return roleAtLeast(workspaceRole, ROLES.PROJECT_MANAGER);
}

export function canManageProject(workspaceRole, projectRole) {
  return canManageWorkspace(workspaceRole) || projectRole === ROLES.PROJECT_MANAGER;
}

/**
 * Read access to a project.
 *
 * - Workspace owners/admins can access every project.
 * - Explicit project membership grants access (including restricted projects).
 * - Any non-guest workspace member can access workspace-visible projects.
 * - Guests only see projects they were explicitly added to.
 */
export function canAccessProject(
  workspaceRole,
  projectRole,
  visibility = "workspace",
) {
  if (canManageWorkspace(workspaceRole)) return true;
  if (projectRole) return true;
  if (workspaceRole === ROLES.GUEST) return false;
  return visibility !== "restricted";
}

/**
 * Write access to project work (issues, comments, cards).
 * Guests may contribute only when explicitly added to the project.
 */
export function canContributeToProject(
  workspaceRole,
  projectRole,
  visibility = "workspace",
) {
  if (!canAccessProject(workspaceRole, projectRole, visibility)) return false;
  return workspaceRole !== ROLES.GUEST || Boolean(projectRole);
}

export function canDeleteProject(workspaceRole) {
  return canManageWorkspace(workspaceRole);
}

export default {
  ROLES,
  ROLE_HIERARCHY,
  roleAtLeast,
  PERMISSIONS,
  canManageWorkspace,
  canManageMemberRole,
  canCreateProject,
  canManageProject,
  canDeleteProject,
  canAccessProject,
  canContributeToProject,
};
