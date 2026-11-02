import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { canManageProject } from "../../shared/services/permissionService.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

const COLLECTION = "issues";
const VALID_TYPES = ["epic", "story", "task", "bug", "subtask"];
const VALID_PRIORITIES = ["lowest", "low", "medium", "high", "highest"];
const VALID_STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"];

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

export default class IssueRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async _projectAccess(transaction, projectId, uid) {
    const projectRef = this.db.collection("projects").doc(projectId);
    const project = await transaction.get(projectRef);
    if (!project.exists || project.get("status") !== "active") {
      throw Errors.notFound("Project not found");
    }

    const workspaceRef = this.db
      .collection("workspaces")
      .doc(project.get("workspaceId"));
    const workspaceMemberRef = workspaceRef.collection("members").doc(uid);
    const projectMemberRef = projectRef.collection("members").doc(uid);
    const [workspaceMember, projectMember] = await Promise.all([
      transaction.get(workspaceMemberRef),
      transaction.get(projectMemberRef),
    ]);

    if (!workspaceMember.exists) {
      throw Errors.notFound("Project not found");
    }

    const workspaceRole = workspaceMember.get("role");
    const projectRole = projectMember.exists ? projectMember.get("role") : null;
    return {
      projectRef,
      project: project.data(),
      workspaceRole,
      projectRole,
      canManage: canManageProject(workspaceRole, projectRole),
    };
  }

  async _issueAccess(transaction, issueId, uid) {
    const issueRef = this.db.collection(COLLECTION).doc(issueId);
    const issue = await transaction.get(issueRef);
    if (!issue.exists) {
      throw Errors.notFound("Issue not found");
    }

    const access = await this._projectAccess(
      transaction,
      issue.get("projectId"),
      uid,
    );
    return {
      issueRef,
      issue: issue.data(),
      ...access,
    };
  }

  _normalizeType(type) {
    return VALID_TYPES.includes(type) ? type : "task";
  }

  _normalizePriority(priority) {
    return VALID_PRIORITIES.includes(priority) ? priority : "medium";
  }

  _normalizeStatus(status) {
    return VALID_STATUSES.includes(status) ? status : "backlog";
  }

  _sanitizeIssue(issue) {
    const safeIssue = { ...issue };
    safeIssue.type = this._normalizeType(safeIssue.type);
    safeIssue.priority = this._normalizePriority(safeIssue.priority);
    safeIssue.status = this._normalizeStatus(safeIssue.status);
    safeIssue.labels = Array.isArray(safeIssue.labels)
      ? safeIssue.labels.slice(0, 25)
      : [];
    safeIssue.relatedIssueIds = Array.isArray(safeIssue.relatedIssueIds)
      ? safeIssue.relatedIssueIds.filter(Boolean).slice(0, 25)
      : [];
    return safeIssue;
  }

  async list(projectId, uid, filters = {}) {
    const listResult = await this.db.runTransaction(async (transaction) => {
      const access = await this._projectAccess(transaction, projectId, uid);
      const query = this.db.collection(COLLECTION).where("projectId", "==", projectId);
      const snapshot = await transaction.get(query);
      return { access, snapshot };
    });

    const issues = listResult.snapshot.docs
      .map((snapshot) => ({ id: snapshot.id, ...this._sanitizeIssue(snapshot.data()) }))
      .filter((issue) => {
        if (filters.status && issue.status !== filters.status) return false;
        if (filters.type && issue.type !== filters.type) return false;
        if (filters.priority && issue.priority !== filters.priority) return false;
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const haystack = [
            issue.title,
            issue.description,
            issue.issueKey,
            (issue.labels || []).join(" "),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((left, right) => {
        const leftUpdated = toMillis(left.updatedAt);
        const rightUpdated = toMillis(right.updatedAt);
        return rightUpdated - leftUpdated || left.title.localeCompare(right.title);
      });

    return issues;
  }

  async create(projectId, uid, input) {
    const issueId = generateId();
    const issueRef = this.db.collection(COLLECTION).doc(issueId);
    const timestamp = serverTimestamp();

    return this.db.runTransaction(async (transaction) => {
      const access = await this._projectAccess(transaction, projectId, uid);
      const project = access.project;
      const normalizedStatus = this._normalizeStatus(input.status);
      const issueData = {
        projectId,
        workspaceId: project.workspaceId,
        title: input.title.trim(),
        description: input.description || "",
        type: this._normalizeType(input.type),
        status: normalizedStatus,
        priority: this._normalizePriority(input.priority),
        assigneeId: input.assigneeId || null,
        reporterId: uid,
        createdBy: uid,
        labels: Array.isArray(input.labels) ? input.labels.slice(0, 25) : [],
        dueDate: input.dueDate || null,
        parentIssueId: input.parentIssueId || null,
        relatedIssueIds: [],
        issueKey: `${project.key || "PROJ"}-${issueId.slice(0, 6).toUpperCase()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        resolvedAt: normalizedStatus === "done" ? timestamp : null,
      };

      if (issueData.assigneeId) {
        const assigneeRef = this.db
          .collection("projects")
          .doc(projectId)
          .collection("members")
          .doc(issueData.assigneeId);
        const assignee = await transaction.get(assigneeRef);
        if (!assignee.exists) {
          throw Errors.notFound("Assignee not found in this project");
        }
      }

      if (issueData.parentIssueId) {
        const parentRef = this.db.collection(COLLECTION).doc(issueData.parentIssueId);
        const parent = await transaction.get(parentRef);
        if (!parent.exists || parent.get("projectId") !== projectId) {
          throw Errors.notFound("Parent issue not found in this project");
        }
      }

      transaction.create(issueRef, issueData);
      return { id: issueId, ...issueData, currentUserProjectRole: access.projectRole };
    });
  }

  async get(issueId, uid) {
    return this.db.runTransaction(async (transaction) => {
      const access = await this._issueAccess(transaction, issueId, uid);
      return { id: issueId, ...access.issue };
    });
  }

  async update(issueId, uid, updates) {
    return this.db.runTransaction(async (transaction) => {
      const access = await this._issueAccess(transaction, issueId, uid);
      const issue = access.issue;
      const allowedToEdit =
        access.canManage || issue.reporterId === uid || issue.assigneeId === uid;
      if (!allowedToEdit) {
        throw Errors.forbidden("You cannot edit this issue");
      }

      const nextIssue = {
        ...issue,
        ...updates,
        type: updates.type ? this._normalizeType(updates.type) : issue.type,
        status: updates.status ? this._normalizeStatus(updates.status) : issue.status,
        priority: updates.priority
          ? this._normalizePriority(updates.priority)
          : issue.priority,
        labels: Array.isArray(updates.labels)
          ? updates.labels.slice(0, 25)
          : issue.labels || [],
        relatedIssueIds: Array.isArray(updates.relatedIssueIds)
          ? updates.relatedIssueIds.filter(Boolean).slice(0, 25)
          : issue.relatedIssueIds || [],
      };

      if (updates.assigneeId !== undefined) {
        if (updates.assigneeId) {
          const assigneeRef = this.db
            .collection("projects")
            .doc(issue.projectId)
            .collection("members")
            .doc(updates.assigneeId);
          const assignee = await transaction.get(assigneeRef);
          if (!assignee.exists) {
            throw Errors.notFound("Assignee not found in this project");
          }
        }
        nextIssue.assigneeId = updates.assigneeId || null;
      }

      if (updates.parentIssueId !== undefined) {
        if (updates.parentIssueId) {
          const parentRef = this.db.collection(COLLECTION).doc(updates.parentIssueId);
          const parent = await transaction.get(parentRef);
          if (!parent.exists || parent.get("projectId") !== issue.projectId) {
            throw Errors.notFound("Parent issue not found in this project");
          }
        }
        nextIssue.parentIssueId = updates.parentIssueId || null;
      }

      if (updates.status && updates.status !== issue.status) {
        nextIssue.resolvedAt = updates.status === "done" ? serverTimestamp() : null;
      }

      nextIssue.updatedAt = serverTimestamp();
      transaction.update(access.issueRef, nextIssue);
      return { id: issueId, ...nextIssue };
    });
  }

  async updateStatus(issueId, uid, status) {
    return this.update(issueId, uid, { status: this._normalizeStatus(status) });
  }

  async updateAssignee(issueId, uid, assigneeId) {
    return this.update(issueId, uid, { assigneeId: assigneeId || null });
  }

  async createComment(issueId, uid, input) {
    const commentId = generateId();
    const commentRef = this.db
      .collection(COLLECTION)
      .doc(issueId)
      .collection("comments")
      .doc(commentId);
    const timestamp = serverTimestamp();

    await this.db.runTransaction(async (transaction) => {
      const access = await this._issueAccess(transaction, issueId, uid);
      const issue = access.issue;
      const allowedToComment =
        access.canManage || issue.reporterId === uid || issue.assigneeId === uid;
      if (!allowedToComment) {
        throw Errors.forbidden("You cannot comment on this issue");
      }

      transaction.create(commentRef, {
        id: commentId,
        issueId,
        authorId: uid,
        content: input.content.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });

    return {
      id: commentId,
      issueId,
      authorId: uid,
      content: input.content.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async listComments(issueId, uid) {
    await this.get(issueId, uid);
    const snapshot = await this.db
      .collection(COLLECTION)
      .doc(issueId)
      .collection("comments")
      .get();

    return snapshot.docs
      .map((comment) => ({ id: comment.id, ...comment.data() }))
      .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
  }
}
