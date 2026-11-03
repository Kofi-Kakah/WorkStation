import BoardRepository from "./board.repository.js";

export default class BoardService {
  constructor(repository = new BoardRepository()) {
    this.repository = repository;
  }

  list(projectId, uid) {
    return this.repository.listForProject(projectId, uid);
  }

  create(uid, input) {
    const { projectId, ...board } = input;
    return this.repository.create(projectId, uid, board);
  }

  get(boardId, uid) {
    return this.repository.get(boardId, uid);
  }

  update(boardId, uid, input) {
    return this.repository.update(boardId, uid, input);
  }

  archive(boardId, uid) {
    return this.repository.archive(boardId, uid);
  }

  createList(boardId, uid, input) {
    return this.repository.createList(
      boardId,
      uid,
      input.name,
      input.issueStatus,
    );
  }

  updateList(boardId, listId, uid, input) {
    return this.repository.updateList(
      boardId,
      listId,
      uid,
      input.name,
      input.issueStatus,
    );
  }

  deleteList(boardId, listId, uid) {
    return this.repository.deleteList(boardId, listId, uid);
  }

  reorderLists(boardId, uid, input) {
    return this.repository.reorderLists(boardId, uid, input.listIds);
  }

  createCard(boardId, uid, input) {
    return this.repository.createCard(boardId, uid, input);
  }

  moveCard(boardId, cardId, uid, input) {
    return this.repository.moveCard(boardId, cardId, uid, input);
  }

  removeCard(boardId, cardId, uid) {
    return this.repository.removeCard(boardId, cardId, uid);
  }
}