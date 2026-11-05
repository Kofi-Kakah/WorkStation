import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";
import IssueRepository from "../issues/issue.repository.js";

export default class SprintRepository {
  constructor(db = getFirestore(), issueRepository = new IssueRepository(db)) {
    this.db = db;
    this.issueRepository = issueRepository;
  }

  async _access(transaction, projectId, uid) {
    return this.issueRepository.getProjectAccessWithinTransaction(
      transaction,
      projectId,
      uid,
    );
  }

  async list(projectId, uid) {
    await this.db.runTransaction(async (transaction) => {
      await this._access(transaction, projectId, uid);
    });
    const snapshot = await this.db
      .collection("sprints")
      .where("projectId", "==", projectId)
      .get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((left, right) => (right.startDate || "").localeCompare(left.startDate || ""));
  }

  async create(uid, input) {
    const id = generateId();
    const ref = this.db.collection("sprints").doc(id);
    const now = serverTimestamp();
    const sprint = {
      projectId: input.projectId,
      workspaceId: null,
      name: input.name.trim(),
      goal: input.goal.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      status: "planned",
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runTransaction(async (transaction) => {
      const access = await this._access(transaction, input.projectId, uid);
      if (!access.canManage) {
        throw Errors.forbidden("You cannot manage sprints in this project");
      }
      sprint.workspaceId = access.project.workspaceId;
      transaction.create(ref, sprint);
    });
    return { id, ...sprint };
  }

  async setStatus(sprintId, uid, status) {
    const ref = this.db.collection("sprints").doc(sprintId);
    await this.db.runTransaction(async (transaction) => {
      const sprint = await transaction.get(ref);
      if (!sprint.exists) throw Errors.notFound("Sprint not found");
      const access = await this._access(
        transaction,
        sprint.get("projectId"),
        uid,
      );
      if (!access.canManage) {
        throw Errors.forbidden("You cannot manage this sprint");
      }
      const currentStatus = sprint.get("status");
      const validNextStatuses = {
        planned: ["planned", "active"],
        active: ["active", "completed"],
        completed: ["completed"],
      };
      if (!validNextStatuses[currentStatus]?.includes(status)) {
        throw Errors.conflict("Sprint status transition is not allowed");
      }
      transaction.update(ref, { status, updatedAt: serverTimestamp() });
    });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async assignIssues(sprintId, uid, issueIds) {
    const sprintRef = this.db.collection("sprints").doc(sprintId);
    await this.db.runTransaction(async (transaction) => {
      const sprint = await transaction.get(sprintRef);
      if (!sprint.exists) throw Errors.notFound("Sprint not found");
      const access = await this._access(
        transaction,
        sprint.get("projectId"),
        uid,
      );
      if (!access.canManage) {
        throw Errors.forbidden("You cannot plan issues in this sprint");
      }
      if (sprint.get("status") === "completed") {
        throw Errors.conflict("Issues cannot be added to a completed sprint");
      }
      const uniqueIds = [...new Set(issueIds)];
      const issueRefs = uniqueIds.map((issueId) =>
        this.db.collection("issues").doc(issueId),
      );
      const issueSnapshots = await Promise.all(
        issueRefs.map((ref) => transaction.get(ref)),
      );
      if (
        issueSnapshots.some(
          (issue) =>
            !issue.exists || issue.get("projectId") !== sprint.get("projectId"),
        )
      ) {
        throw Errors.notFound("One or more issues are not in this project");
      }
      issueRefs.forEach((ref) =>
        transaction.update(ref, {
          sprintId,
          updatedAt: serverTimestamp(),
        }),
      );
    });
    return { sprintId, assignedCount: new Set(issueIds).size };
  }
}
