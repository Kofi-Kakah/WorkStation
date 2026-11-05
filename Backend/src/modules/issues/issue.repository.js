import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import {
  canAccessProject,
  canContributeToProject,
  canManageProject,
} from "../../shared/services/permissionService.js";
import {
  normalizeIssueStatus,
  statusForBoardList,
} from "../../shared/services/issueWorkflowService.js";
import ActivityService from "../../shared/services/activityService.js";
import NotificationService from "../../shared/services/notificationService.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

const COLLECTION = "issues";
const VALID_TYPES = ["epic", "story", "task", "bug", "subtask"];
const VALID_PRIORITIES = ["lowest", "low", "medium", "high", "highest"];
const POSITION_GAP = 1024;
const MAX_CARDS_PER_LIST = 400;

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
    const visibility = project.get("visibility") || "workspace";
    if (!canAccessProject(workspaceRole, projectRole, visibility)) {
      throw Errors.notFound("Project not found");
    }
    return {
      projectRef,
      project: project.data(),
      workspaceRole,
      projectRole,
      visibility,
      canManage: canManageProject(workspaceRole, projectRole),
      canContribute: canContributeToProject(
        workspaceRole,
        projectRole,
        visibility,
      ),
    };
  }

  getProjectAccessWithinTransaction(transaction, projectId, uid) {
    return this._projectAccess(transaction, projectId, uid);
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
    return normalizeIssueStatus(status);
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
        if (filters.assigneeId && issue.assigneeId !== filters.assigneeId) {
          return false;
        }
        if (filters.sprintId && issue.sprintId !== filters.sprintId) {
          return false;
        }
        const dueDate =
          typeof issue.dueDate === "string" ? issue.dueDate.slice(0, 10) : "";
        if (filters.dueDateFrom && (!dueDate || dueDate < filters.dueDateFrom)) {
          return false;
        }
        if (filters.dueDateTo && (!dueDate || dueDate > filters.dueDateTo)) {
          return false;
        }
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

  async createWithinTransaction(
    transaction,
    projectId,
    uid,
    input,
    { sourceMessage = null, projectAccess = null } = {},
  ) {
    const issueId = generateId();
    const issueRef = this.db.collection(COLLECTION).doc(issueId);
    const timestamp = serverTimestamp();

    const access =
      projectAccess ||
      (await this._projectAccess(transaction, projectId, uid));
    if (!access.canContribute) {
      throw Errors.forbidden("You cannot create issues in this project");
    }
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
      sprintId: null,
      parentIssueId: input.parentIssueId || null,
      relatedIssueIds: [],
      sourceChannelId: sourceMessage?.channelId || null,
      sourceMessageId: sourceMessage?.messageId || null,
      sourceConversationType: sourceMessage?.conversationType || null,
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
  }

  async create(projectId, uid, input) {
    let pushNotification = null;
    const issue = await this.db.runTransaction(async (transaction) => {
      pushNotification = null;
      const [actorProfile, recipientProfile] = await Promise.all([
        transaction.get(this.db.collection("users").doc(uid)),
        input.assigneeId && input.assigneeId !== uid
          ? transaction.get(
              this.db.collection("users").doc(input.assigneeId),
            )
          : Promise.resolve(null),
      ]);
      const createdIssue = await this.createWithinTransaction(
        transaction,
        projectId,
        uid,
        input,
      );
      const activity = ActivityService.recordWithinTransaction(
        transaction,
        this.db,
        createdIssue.workspaceId,
        {
          actorId: uid,
          actorName: actorProfile?.get("displayName"),
          action: "issue.created",
          resource: {
            type: "issue",
            id: createdIssue.id,
            key: createdIssue.issueKey,
          },
        },
      );
      if (createdIssue.assigneeId && createdIssue.assigneeId !== uid) {
        const notification = NotificationService.recordWithinTransaction(
          transaction,
          this.db,
          {
            userId: createdIssue.assigneeId,
            workspaceId: createdIssue.workspaceId,
            type: "issue",
            title: "You were assigned an issue",
            body: `${createdIssue.issueKey}: ${createdIssue.title}`,
            resource: { type: "issue", id: createdIssue.id },
            link: `/issues/${createdIssue.id}`,
            actorId: uid,
            dedupeKey: activity ? `issue-created-${activity.id}` : null,
            recipientProfile: recipientProfile?.data(),
          },
        );
        if (notification?.pushEnabled) {
          pushNotification = {
            userId: createdIssue.assigneeId,
            payload: notification.payload,
          };
        }
      }
      return createdIssue;
    });
    if (pushNotification) {
      await NotificationService.dispatchPush(
        pushNotification.userId,
        pushNotification.payload,
        this.db,
      );
    }
    return issue;
  }

  async get(issueId, uid) {
    return this.db.runTransaction(async (transaction) => {
      const access = await this._issueAccess(transaction, issueId, uid);
      return { id: issueId, ...access.issue };
    });
  }

  async update(issueId, uid, updates) {
    let pushNotifications = [];
    const issue = await this.db.runTransaction((transaction) => {
      pushNotifications = [];
      return this.updateWithinTransaction(
        transaction,
        issueId,
        uid,
        updates,
        { onNotification: (notification) => pushNotifications.push(notification) },
      );
    });
    await Promise.all(
      pushNotifications.map((notification) =>
        NotificationService.dispatchPush(
          notification.userId,
          notification.payload,
          this.db,
        ),
      ),
    );
    return issue;
  }

  async _boardPlacementUpdates(
    transaction,
    issueId,
    projectId,
    status,
    skipBoardId,
  ) {
    const boards = await transaction.get(
      this.db.collection("boards").where("projectId", "==", projectId),
    );
    const updates = [];

    for (const boardSnapshot of boards.docs) {
      if (boardSnapshot.id === skipBoardId || boardSnapshot.get("archived")) {
        continue;
      }

      const boardRef = boardSnapshot.ref;
      const [cards, lists] = await Promise.all([
        transaction.get(
          boardRef.collection("cards").where("issueId", "==", issueId),
        ),
        transaction.get(boardRef.collection("lists").orderBy("position", "asc")),
      ]);
      const card = cards.docs[0];
      if (!card) continue;

      const currentList = lists.docs.find(
        (list) => list.id === card.get("listId"),
      );
      if (currentList && statusForBoardList(currentList.data()) === status) {
        continue;
      }

      const targetList = lists.docs
        .map((list) => ({ id: list.id, ...list.data() }))
        .find((list) => statusForBoardList(list) === status);
      if (!targetList) {
        throw Errors.validation(
          `A board containing this issue needs a list mapped to the "${status}" status`,
        );
      }
      if (card.get("listId") === targetList.id) continue;

      const destinationCards = await transaction.get(
        boardRef
          .collection("cards")
          .where("listId", "==", targetList.id)
          .orderBy("position", "desc")
          .limit(MAX_CARDS_PER_LIST),
      );
      if (destinationCards.size >= MAX_CARDS_PER_LIST) {
        throw Errors.validation(
          `The "${targetList.name}" list is full; move or remove a card before changing this issue's status`,
        );
      }
      const nextPosition =
        (destinationCards.docs[0]?.get("position") || 0) + POSITION_GAP;
      updates.push({
        ref: card.ref,
        listId: targetList.id,
        position: nextPosition,
      });
    }

    return updates;
  }

  async updateWithinTransaction(
    transaction,
    issueId,
    uid,
    updates,
    { skipBoardId = null, onNotification = null } = {},
  ) {
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

      const boardUpdates =
        updates.status && updates.status !== issue.status
          ? await this._boardPlacementUpdates(
              transaction,
              issueId,
              issue.projectId,
              nextIssue.status,
              skipBoardId,
            )
          : [];

      const statusChanged =
        updates.status && updates.status !== issue.status;
      const assigneeChanged =
        updates.assigneeId !== undefined &&
        nextIssue.assigneeId &&
        nextIssue.assigneeId !== issue.assigneeId;
      const actorProfile = statusChanged || assigneeChanged
        ? await transaction.get(this.db.collection("users").doc(uid))
        : null;
      const notificationUserIds = new Set();
      if (statusChanged && issue.assigneeId && issue.assigneeId !== uid) {
        notificationUserIds.add(issue.assigneeId);
      }
      if (assigneeChanged && nextIssue.assigneeId !== uid) {
        notificationUserIds.add(nextIssue.assigneeId);
      }
      const recipientProfiles = new Map(
        await Promise.all(
          [...notificationUserIds].map(async (userId) => [
            userId,
            await transaction.get(this.db.collection("users").doc(userId)),
          ]),
        ),
      );
      nextIssue.updatedAt = serverTimestamp();
      transaction.update(access.issueRef, nextIssue);
      boardUpdates.forEach(({ ref, listId, position }) => {
        transaction.update(ref, {
          listId,
          position,
          updatedAt: serverTimestamp(),
        });
      });
      if (statusChanged) {
        const activity = ActivityService.recordWithinTransaction(
          transaction,
          this.db,
          issue.workspaceId,
          {
            actorId: uid,
            actorName: actorProfile?.get("displayName"),
            action: "issue.status_changed",
            resource: {
              type: "issue",
              id: issueId,
              key: issue.issueKey,
            },
            context: {
              fromStatus: issue.status,
              toStatus: nextIssue.status,
            },
          },
        );
        if (issue.assigneeId && issue.assigneeId !== uid) {
          const notification = NotificationService.recordWithinTransaction(
            transaction,
            this.db,
            {
              userId: issue.assigneeId,
              workspaceId: issue.workspaceId,
              type: "issue",
              title: "Issue status changed",
              body: `${issue.issueKey || "An issue"} moved to ${nextIssue.status.replaceAll("_", " ")}.`,
              resource: { type: "issue", id: issueId },
              link: `/issues/${issueId}`,
              actorId: uid,
              dedupeKey: activity ? `issue-status-${activity.id}` : null,
              recipientProfile: recipientProfiles.get(issue.assigneeId)?.data(),
            },
          );
          if (notification?.pushEnabled) {
            onNotification?.({
              userId: issue.assigneeId,
              payload: notification.payload,
            });
          }
        }
      }
      if (assigneeChanged && nextIssue.assigneeId !== uid) {
        const activity = ActivityService.recordWithinTransaction(
          transaction,
          this.db,
          issue.workspaceId,
          {
            actorId: uid,
            actorName: actorProfile?.get("displayName"),
            action: "issue.assignee_changed",
            resource: {
              type: "issue",
              id: issueId,
              key: issue.issueKey,
            },
            context: {
              fromAssigneeId: issue.assigneeId || null,
              toAssigneeId: nextIssue.assigneeId,
            },
          },
        );
        const notification = NotificationService.recordWithinTransaction(
          transaction,
          this.db,
          {
            userId: nextIssue.assigneeId,
            workspaceId: issue.workspaceId,
            type: "issue",
            title: "You were assigned an issue",
            body: `${issue.issueKey || "An issue"}: ${nextIssue.title}`,
            resource: { type: "issue", id: issueId },
            link: `/issues/${issueId}`,
            actorId: uid,
            dedupeKey: activity ? `issue-assigned-${activity.id}` : null,
            recipientProfile: recipientProfiles.get(nextIssue.assigneeId)?.data(),
          },
        );
        if (notification?.pushEnabled) {
          onNotification?.({
            userId: nextIssue.assigneeId,
            payload: notification.payload,
          });
        }
      }
      return { id: issueId, ...nextIssue };
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
    let pushNotifications = [];

    await this.db.runTransaction(async (transaction) => {
      pushNotifications = [];
      const access = await this._issueAccess(transaction, issueId, uid);
      const issue = access.issue;
      if (!access.canContribute) {
        throw Errors.forbidden("You cannot comment on this issue");
      }

      const recipients = new Set(
        [issue.assigneeId, issue.reporterId].filter(
          (recipientId) => recipientId && recipientId !== uid,
        ),
      );
      const [actorProfile, ...recipientProfiles] = await Promise.all([
        transaction.get(this.db.collection("users").doc(uid)),
        ...[...recipients].map((recipientId) =>
          transaction.get(this.db.collection("users").doc(recipientId)),
        ),
      ]);
      const profileById = new Map(
        [...recipients].map((recipientId, index) => [
          recipientId,
          recipientProfiles[index],
        ]),
      );
      const activity = ActivityService.recordWithinTransaction(
        transaction,
        this.db,
        issue.workspaceId,
        {
          actorId: uid,
          actorName: actorProfile.get("displayName"),
          action: "issue.comment_added",
          resource: {
            type: "issue",
            id: issueId,
            key: issue.issueKey,
          },
          context: { commentId },
        },
      );
      transaction.create(commentRef, {
        id: commentId,
        issueId,
        authorId: uid,
        content: input.content.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      recipients.forEach((recipientId) => {
        const notification = NotificationService.recordWithinTransaction(
          transaction,
          this.db,
          {
            userId: recipientId,
            workspaceId: issue.workspaceId,
            type: "comment",
            title: "New comment on an issue",
            body: input.content.trim().slice(0, 240),
            resource: { type: "issue", id: issueId },
            link: `/issues/${issueId}`,
            actorId: uid,
            dedupeKey: activity
              ? `issue-comment-${activity.id}-${recipientId}`
              : null,
            recipientProfile: profileById.get(recipientId)?.data(),
          },
        );
        if (notification?.pushEnabled) {
          pushNotifications.push({
            userId: recipientId,
            payload: notification.payload,
          });
        }
      });
    });
    await Promise.all(
      pushNotifications.map((notification) =>
        NotificationService.dispatchPush(
          notification.userId,
          notification.payload,
          this.db,
        ),
      ),
    );

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
