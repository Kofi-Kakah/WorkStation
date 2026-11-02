import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import {
  canCreateProject,
  canDeleteProject,
  canManageProject,
  ROLES,
} from "../../shared/services/permissionService.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

const COLLECTION = "projects";

function projectFromSnapshot(snapshot, projectRole) {
  return {
    id: snapshot.id,
    ...snapshot.data(),
    ...(projectRole ? { currentUserProjectRole: projectRole } : {}),
  };
}

export default class ProjectRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async listForWorkspace(workspaceId, uid) {
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(uid);
    const query = this.db
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId);
    const { projects, workspaceRole } = await this.db.runTransaction(
      async (transaction) => {
        const [workspace, actor, projectResults] = await Promise.all([
          transaction.get(workspaceRef),
          transaction.get(actorRef),
          transaction.get(query),
        ]);
        if (!workspace.exists || !actor.exists) {
          throw Errors.notFound("Workspace not found");
        }
        return {
          projects: projectResults.docs,
          workspaceRole: actor.get("role"),
        };
      },
    );

    const visibleProjects = await Promise.all(
      projects
        .filter((snapshot) => snapshot.get("status") === "active")
        .map(async (snapshot) => {
          const membership = await snapshot.ref
            .collection("members")
            .doc(uid)
            .get();
          const projectRole = membership.exists
            ? membership.get("role")
            : null;
          if (
            snapshot.get("visibility") === "restricted" &&
            !canManageProject(workspaceRole, projectRole)
          ) {
            return null;
          }
          return projectFromSnapshot(snapshot, projectRole);
        }),
    );
    return visibleProjects
      .filter(Boolean)
      .sort((left, right) => {
        const leftTime = left.createdAt?.toMillis?.() || 0;
        const rightTime = right.createdAt?.toMillis?.() || 0;
        return rightTime - leftTime;
      });
  }

  async create(workspaceId, actorUid, input) {
    const projectId = generateId();
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const workspaceMemberRef = workspaceRef.collection("members").doc(actorUid);
    const projectMemberRef = projectRef.collection("members").doc(actorUid);
    const timestamp = serverTimestamp();
    const project = {
      workspaceId,
      name: input.name,
      key: `${input.name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 5) || "PROJ"}-${projectId.slice(0, 6).toUpperCase()}`,
      description: input.description,
      visibility: input.visibility,
      status: "active",
      createdBy: actorUid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.db.runTransaction(async (transaction) => {
      const [workspace, actor] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(workspaceMemberRef),
      ]);
      if (!workspace.exists || !actor.exists) {
        throw Errors.notFound("Workspace not found");
      }
      if (!canCreateProject(actor.get("role"))) {
        throw Errors.forbidden("You cannot create projects in this workspace");
      }
      transaction.create(projectRef, project);
      transaction.create(projectMemberRef, {
        userId: actorUid,
        role: ROLES.PROJECT_MANAGER,
        addedBy: actorUid,
        joinedAt: timestamp,
      });
    });

    return {
      id: projectId,
      ...project,
      currentUserProjectRole: ROLES.PROJECT_MANAGER,
    };
  }

  async get(projectId, uid) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    return this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists || project.get("status") !== "active") {
        throw Errors.notFound("Project not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const workspaceMemberRef = workspaceRef
        .collection("members")
        .doc(uid);
      const projectMemberRef = projectRef.collection("members").doc(uid);
      const [workspace, workspaceMember, projectMember] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(workspaceMemberRef),
        transaction.get(projectMemberRef),
      ]);
      if (!workspace.exists || !workspaceMember.exists) {
        throw Errors.notFound("Project not found");
      }
      const projectRole = projectMember.exists
        ? projectMember.get("role")
        : null;
      if (
        project.get("visibility") === "restricted" &&
        !canManageProject(workspaceMember.get("role"), projectRole)
      ) {
        throw Errors.notFound("Project not found");
      }
      return projectFromSnapshot(project, projectRole);
    });
  }

  async update(projectId, actorUid, updates) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    await this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists || project.get("status") !== "active") {
        throw Errors.notFound("Project not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const workspaceMemberRef = workspaceRef
        .collection("members")
        .doc(actorUid);
      const projectMemberRef = projectRef.collection("members").doc(actorUid);
      const [workspace, workspaceMember, projectMember] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(workspaceMemberRef),
        transaction.get(projectMemberRef),
      ]);
      if (!workspace.exists || !workspaceMember.exists) {
        throw Errors.notFound("Project not found");
      }
      const projectRole = projectMember.exists
        ? projectMember.get("role")
        : null;
      if (!canManageProject(workspaceMember.get("role"), projectRole)) {
        throw Errors.forbidden("You cannot manage this project");
      }
      transaction.update(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    });
    return this.get(projectId, actorUid);
  }

  async archive(projectId, actorUid) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    await this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists || project.get("status") !== "active") {
        throw Errors.notFound("Project not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const workspaceMemberRef = workspaceRef
        .collection("members")
        .doc(actorUid);
      const projectMemberRef = projectRef.collection("members").doc(actorUid);
      const [workspaceMember, projectMember] = await Promise.all([
        transaction.get(workspaceMemberRef),
        transaction.get(projectMemberRef),
      ]);
      if (!workspaceMember.exists) throw Errors.notFound("Project not found");
      const projectRole = projectMember.exists
        ? projectMember.get("role")
        : null;
      if (!canManageProject(workspaceMember.get("role"), projectRole)) {
        throw Errors.forbidden("You cannot archive this project");
      }
      transaction.update(projectRef, {
        status: "archived",
        archivedAt: serverTimestamp(),
        archivedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async delete(projectId, actorUid) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    await this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists) throw Errors.notFound("Project not found");
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const workspaceMemberRef = workspaceRef
        .collection("members")
        .doc(actorUid);
      const workspaceMember = await transaction.get(workspaceMemberRef);
      if (!workspaceMember.exists) throw Errors.notFound("Project not found");
      if (!canDeleteProject(workspaceMember.get("role"))) {
        throw Errors.forbidden(
          "Only workspace owners and admins can delete projects",
        );
      }
      transaction.update(projectRef, {
        status: "deleted",
        deletedAt: serverTimestamp(),
        deletedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async listMembers(projectId, actorUid) {
    const project = await this.get(projectId, actorUid);
    const memberSnapshot = await this.db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("members")
      .orderBy("joinedAt", "asc")
      .get();
    const members = await Promise.all(
      memberSnapshot.docs.map(async (member) => {
        const profile = await this.db
          .collection("users")
          .doc(member.id)
          .get();
        return {
          userId: member.id,
          role: member.get("role"),
          joinedAt: member.get("joinedAt"),
          profile: profile.exists
            ? {
                displayName: profile.get("displayName") || "User",
                email: profile.get("email") || null,
                avatarUrl: profile.get("avatarUrl") || null,
              }
            : null,
        };
      }),
    );
    return { project, members };
  }

  async addMember(projectId, actorUid, targetUid, role) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    await this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists || project.get("status") !== "active") {
        throw Errors.notFound("Project not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const actorWorkspaceRef = workspaceRef
        .collection("members")
        .doc(actorUid);
      const targetWorkspaceRef = workspaceRef
        .collection("members")
        .doc(targetUid);
      const actorProjectRef = projectRef.collection("members").doc(actorUid);
      const targetProjectRef = projectRef.collection("members").doc(targetUid);
      const [actorWorkspace, targetWorkspace, actorProject, targetProject] =
        await Promise.all([
          transaction.get(actorWorkspaceRef),
          transaction.get(targetWorkspaceRef),
          transaction.get(actorProjectRef),
          transaction.get(targetProjectRef),
        ]);
      if (!actorWorkspace.exists || !targetWorkspace.exists) {
        throw Errors.notFound("Workspace member not found");
      }
      const actorProjectRole = actorProject.exists
        ? actorProject.get("role")
        : null;
      if (
        !canManageProject(actorWorkspace.get("role"), actorProjectRole)
      ) {
        throw Errors.forbidden("You cannot manage project members");
      }
      if (targetProject.exists) {
        throw Errors.conflict("User is already a project member");
      }
      transaction.create(targetProjectRef, {
        userId: targetUid,
        role,
        addedBy: actorUid,
        joinedAt: serverTimestamp(),
      });
    });
    return { userId: targetUid, role };
  }

  async removeMember(projectId, actorUid, targetUid) {
    const projectRef = this.db.collection(COLLECTION).doc(projectId);
    await this.db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists || project.get("status") !== "active") {
        throw Errors.notFound("Project not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(project.get("workspaceId"));
      const actorWorkspaceRef = workspaceRef
        .collection("members")
        .doc(actorUid);
      const actorProjectRef = projectRef.collection("members").doc(actorUid);
      const targetProjectRef = projectRef.collection("members").doc(targetUid);
      const [actorWorkspace, actorProject, targetProject] = await Promise.all([
        transaction.get(actorWorkspaceRef),
        transaction.get(actorProjectRef),
        transaction.get(targetProjectRef),
      ]);
      if (!actorWorkspace.exists || !targetProject.exists) {
        throw Errors.notFound("Project member not found");
      }
      const actorProjectRole = actorProject.exists
        ? actorProject.get("role")
        : null;
      if (
        !canManageProject(actorWorkspace.get("role"), actorProjectRole)
      ) {
        throw Errors.forbidden("You cannot manage project members");
      }
      if (targetProject.get("role") === ROLES.PROJECT_MANAGER) {
        const managers = await transaction.get(
          projectRef
            .collection("members")
            .where("role", "==", ROLES.PROJECT_MANAGER),
        );
        if (managers.size <= 1) {
          throw Errors.conflict(
            "A project must have at least one project manager",
          );
        }
      }
      transaction.delete(targetProjectRef);
    });
  }
}