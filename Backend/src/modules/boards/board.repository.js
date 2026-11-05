import { createHash } from "node:crypto";
import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import {
  canAccessProject,
  canManageProject,
} from "../../shared/services/permissionService.js";
import {
  normalizeIssueStatus,
  statusForBoardList,
} from "../../shared/services/issueWorkflowService.js";
import NotificationService from "../../shared/services/notificationService.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";
import IssueRepository from "../issues/issue.repository.js";

const COLLECTION = "boards";
const POSITION_GAP = 1024;
const MAX_CARDS_PER_LIST = 400;
const MAX_CARDS_PER_BOARD = 400;
function cardIdForIssue(boardId, issueId) {
  return createHash("sha256")
    .update(JSON.stringify([boardId, issueId]))
    .digest("hex");
}

function orderedByPosition(left, right) {
  return left.position - right.position || left.id.localeCompare(right.id);
}

export default class BoardRepository {
  constructor(db = getFirestore()) {
    this.db = db;
    this.issueRepository = new IssueRepository(db);
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
    const [workspaceMember, projectMember] = await Promise.all([
      transaction.get(workspaceRef.collection("members").doc(uid)),
      transaction.get(projectRef.collection("members").doc(uid)),
    ]);
    if (!workspaceMember.exists) throw Errors.notFound("Project not found");

    const workspaceRole = workspaceMember.get("role");
    const projectRole = projectMember.exists ? projectMember.get("role") : null;
    if (
      !canAccessProject(
        workspaceRole,
        projectRole,
        project.get("visibility") || "workspace",
      )
    ) {
      throw Errors.notFound("Project not found");
    }
    return {
      projectRef,
      project: project.data(),
      workspaceRole,
      projectRole,
      canManage: canManageProject(workspaceRole, projectRole),
    };
  }

  async _boardAccess(transaction, boardId, uid, { manage = false } = {}) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const board = await transaction.get(boardRef);
    if (!board.exists || board.get("archived")) {
      throw Errors.notFound("Board not found");
    }
    const access = await this._projectAccess(
      transaction,
      board.get("projectId"),
      uid,
    );
    if (manage && !access.canManage) {
      throw Errors.forbidden("You cannot manage this board");
    }
    return { boardRef, board: board.data(), ...access };
  }

  async listForProject(projectId, uid) {
    await this.db.runTransaction((transaction) =>
      this._projectAccess(transaction, projectId, uid),
    );
    const result = await this.db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .get();
    return result.docs
      .filter((snapshot) => !snapshot.get("archived"))
      .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async create(projectId, uid, input) {
    const boardId = generateId();
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const timestamp = serverTimestamp();
    const board = {
      projectId,
      name: input.name,
      description: input.description,
      archived: false,
      createdBy: uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const defaults = [
      { name: "Backlog", issueStatus: "backlog" },
      { name: "To do", issueStatus: "todo" },
      { name: "In progress", issueStatus: "in_progress" },
      { name: "In review", issueStatus: "in_review" },
      { name: "Done", issueStatus: "done" },
    ];

    await this.db.runTransaction(async (transaction) => {
      const access = await this._projectAccess(transaction, projectId, uid);
      if (!access.canManage) {
        throw Errors.forbidden("You cannot create boards in this project");
      }
      transaction.create(boardRef, board);
      defaults.forEach((list, index) => {
        transaction.create(boardRef.collection("lists").doc(generateId()), {
          ...list,
          position: (index + 1) * POSITION_GAP,
          createdBy: uid,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });
    });

    return { id: boardId, ...board };
  }

  async get(boardId, uid) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const board = await this.db.runTransaction(async (transaction) => {
      const access = await this._boardAccess(transaction, boardId, uid);
      return { id: boardId, ...access.board };
    });
    const [listSnapshot, cardSnapshot] = await Promise.all([
      boardRef.collection("lists").get(),
      boardRef.collection("cards").get(),
    ]);
    const lists = listSnapshot.docs
      .map((snapshot) => ({ id: snapshot.id, ...snapshot.data(), cards: [] }))
      .sort(orderedByPosition);
    const listById = new Map(lists.map((list) => [list.id, list]));
    const cards = await Promise.all(
      cardSnapshot.docs.map(async (snapshot) => {
        const card = { id: snapshot.id, ...snapshot.data() };
        const issueSnapshot = await this.db
          .collection("issues")
          .doc(card.issueId)
          .get();
        const issue =
          issueSnapshot.exists &&
          issueSnapshot.get("projectId") === board.projectId
            ? { id: issueSnapshot.id, ...issueSnapshot.data() }
            : null;
        return { ...card, issue };
      }),
    );
    cards.sort(orderedByPosition);
    cards.forEach((card) => listById.get(card.listId)?.cards.push(card));
    return { ...board, lists };
  }

  async update(boardId, uid, updates) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      transaction.update(boardRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    });
    return this.get(boardId, uid);
  }

  async archive(boardId, uid) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      transaction.update(boardRef, {
        archived: true,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async createList(boardId, uid, name, issueStatus = null) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const listRef = boardRef.collection("lists").doc(generateId());
    const timestamp = serverTimestamp();
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      const lists = await transaction.get(
        boardRef.collection("lists").orderBy("position", "desc").limit(100),
      );
      if (lists.size >= 100) {
        throw Errors.validation("A board can have at most 100 lists");
      }
      const lastPosition = lists.docs[0]?.get("position") || 0;
      transaction.create(listRef, {
        name,
        issueStatus: issueStatus || statusForBoardList({ name }),
        position: lastPosition + POSITION_GAP,
        createdBy: uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
    return {
      id: listRef.id,
      name,
      issueStatus: issueStatus || statusForBoardList({ name }),
      createdBy: uid,
      createdAt: timestamp,
    };
  }

  async updateList(boardId, listId, uid, name, issueStatus) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const listRef = boardRef.collection("lists").doc(listId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      const list = await transaction.get(listRef);
      if (!list.exists) throw Errors.notFound("List not found");
      transaction.update(listRef, {
        ...(name !== undefined ? { name } : {}),
        ...(issueStatus !== undefined
          ? { issueStatus: issueStatus || null }
          : {}),
        updatedAt: serverTimestamp(),
      });
    });
    return {
      id: listId,
      ...(name !== undefined ? { name } : {}),
      ...(issueStatus !== undefined ? { issueStatus } : {}),
    };
  }

  async deleteList(boardId, listId, uid) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const listRef = boardRef.collection("lists").doc(listId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      const [list, cards] = await Promise.all([
        transaction.get(listRef),
        transaction.get(
          boardRef.collection("cards").where("listId", "==", listId),
        ),
      ]);
      if (!list.exists) throw Errors.notFound("List not found");
      if (!cards.empty) {
        throw Errors.conflict("Move or remove cards before deleting this list");
      }
      transaction.delete(listRef);
    });
  }

  async reorderLists(boardId, uid, listIds) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid, { manage: true });
      const current = await transaction.get(
        boardRef.collection("lists").orderBy("position", "asc"),
      );
      const existingIds = current.docs.map((snapshot) => snapshot.id).sort();
      const requestedIds = [...listIds].sort();
      if (
        existingIds.length !== requestedIds.length ||
        existingIds.some((id, index) => id !== requestedIds[index])
      ) {
        throw Errors.validation(
          "List order must include every board list exactly once",
        );
      }
      listIds.forEach((listId, index) => {
        transaction.update(boardRef.collection("lists").doc(listId), {
          position: (index + 1) * POSITION_GAP,
          updatedAt: serverTimestamp(),
        });
      });
    });
  }

  async createCard(boardId, uid, { issueId, listId }) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const cardId = cardIdForIssue(boardId, issueId);
    const cardRef = boardRef.collection("cards").doc(cardId);
    const listRef = boardRef.collection("lists").doc(listId);
    const issueRef = this.db.collection("issues").doc(issueId);
    const timestamp = serverTimestamp();
    let position;
    let pushNotifications = [];
    await this.db.runTransaction(async (transaction) => {
      pushNotifications = [];
      const access = await this._boardAccess(transaction, boardId, uid);
      const [list, issue, existingCard, cards, boardCards] = await Promise.all([
        transaction.get(listRef),
        transaction.get(issueRef),
        transaction.get(cardRef),
        transaction.get(
          boardRef
            .collection("cards")
            .where("listId", "==", listId)
            .orderBy("position", "desc")
            .limit(MAX_CARDS_PER_LIST + 1),
        ),
        transaction.get(
          boardRef
            .collection("cards")
            .orderBy("position", "asc")
            .limit(MAX_CARDS_PER_BOARD + 1),
        ),
      ]);
      if (!list.exists) throw Errors.notFound("Board list not found");
      if (!issue.exists || issue.get("projectId") !== access.board.projectId) {
        throw Errors.notFound("Issue not found in this project");
      }
      const targetStatus = statusForBoardList({ id: list.id, ...list.data() });
      if (!targetStatus) {
        throw Errors.validation(
          "Assign a workflow status to this list before adding issue cards",
        );
      }
      if (existingCard.exists) {
        throw Errors.conflict("This issue is already on the board");
      }
      if (cards.size >= MAX_CARDS_PER_LIST) {
        throw Errors.validation("A list can have at most 400 cards");
      }
      if (boardCards.size >= MAX_CARDS_PER_BOARD) {
        throw Errors.validation("A board can have at most 400 issue cards");
      }
      if (normalizeIssueStatus(issue.get("status")) !== targetStatus) {
        await this.issueRepository.updateWithinTransaction(
          transaction,
          issueId,
          uid,
          { status: targetStatus },
          {
            skipBoardId: boardId,
            onNotification: (notification) =>
              pushNotifications.push(notification),
          },
        );
      }
      position = (cards.docs[0]?.get("position") || 0) + POSITION_GAP;
      transaction.create(cardRef, {
        issueId,
        listId,
        position,
        createdBy: uid,
        createdAt: timestamp,
        updatedAt: timestamp,
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
      id: cardId,
      issueId,
      listId,
      position,
      createdBy: uid,
      createdAt: timestamp,
    };
  }

  async moveCard(boardId, cardId, uid, { listId, position }) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const cardRef = boardRef.collection("cards").doc(cardId);
    const targetListRef = boardRef.collection("lists").doc(listId);
    let pushNotifications = [];
    await this.db.runTransaction(async (transaction) => {
      pushNotifications = [];
      const access = await this._boardAccess(transaction, boardId, uid);
      const cardSnapshot = await transaction.get(cardRef);
      if (!cardSnapshot.exists) throw Errors.notFound("Card not found");
      const issueRef = this.db.collection("issues").doc(cardSnapshot.get("issueId"));
      const [targetList, targetCards, issue] = await Promise.all([
        transaction.get(targetListRef),
        transaction.get(
          boardRef
            .collection("cards")
            .where("listId", "==", listId)
            .orderBy("position", "asc")
            .limit(MAX_CARDS_PER_LIST + 1),
        ),
        transaction.get(issueRef),
      ]);
      if (!targetList.exists) throw Errors.notFound("Target list not found");
      if (!issue.exists || issue.get("projectId") !== access.board.projectId) {
        throw Errors.notFound("Issue not found in this project");
      }
      if (targetCards.size > MAX_CARDS_PER_LIST) {
        throw Errors.validation("A list can have at most 400 cards");
      }
      const targetStatus = statusForBoardList({
        id: targetList.id,
        ...targetList.data(),
      });
      if (!targetStatus) {
        throw Errors.validation(
          "Assign a workflow status to this list before moving issue cards",
        );
      }

      const orderedCards = targetCards.docs
        .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
        .filter((entry) => entry.id !== cardId)
        .sort(orderedByPosition);
      if (position > orderedCards.length) {
        throw Errors.validation("Card position is outside the target list");
      }
      orderedCards.splice(position, 0, {
        id: cardId,
        ...cardSnapshot.data(),
        listId,
      });

      if (normalizeIssueStatus(issue.get("status")) !== targetStatus) {
        await this.issueRepository.updateWithinTransaction(
          transaction,
          issue.id,
          uid,
          { status: targetStatus },
          {
            skipBoardId: boardId,
            onNotification: (notification) =>
              pushNotifications.push(notification),
          },
        );
      }

      const previous = orderedCards[position - 1]?.position;
      const next = orderedCards[position + 1]?.position;
      const canUseGap =
        (previous === undefined || Number.isSafeInteger(previous)) &&
        (next === undefined || Number.isSafeInteger(next)) &&
        (previous === undefined ||
          next === undefined ||
          next - previous > 1);
      if (canUseGap) {
        const newPosition =
          previous === undefined
            ? next === undefined
              ? POSITION_GAP
              : next - POSITION_GAP
            : next === undefined
              ? previous + POSITION_GAP
              : Math.floor((previous + next) / 2);
        if (Number.isSafeInteger(newPosition)) {
          transaction.update(cardRef, {
            listId,
            position: newPosition,
            updatedAt: serverTimestamp(),
          });
          return;
        }
      }

      orderedCards.forEach((entry, index) => {
        transaction.update(boardRef.collection("cards").doc(entry.id), {
          listId,
          position: (index + 1) * POSITION_GAP,
          ...(entry.id === cardId ? { updatedAt: serverTimestamp() } : {}),
        });
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
  }

  async removeCard(boardId, cardId, uid) {
    const boardRef = this.db.collection(COLLECTION).doc(boardId);
    const cardRef = boardRef.collection("cards").doc(cardId);
    await this.db.runTransaction(async (transaction) => {
      await this._boardAccess(transaction, boardId, uid);
      const card = await transaction.get(cardRef);
      if (!card.exists) throw Errors.notFound("Card not found");
      transaction.delete(cardRef);
    });
  }
}