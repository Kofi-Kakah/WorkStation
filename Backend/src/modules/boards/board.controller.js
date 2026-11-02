import BoardService from "./board.service.js";

export default class BoardController {
  constructor(service = new BoardService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const boards = await this.service.list(req.query.projectId, req.user.uid);
      return res.json({ ok: true, boards });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const board = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, board });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const board = await this.service.get(req.params.boardId, req.user.uid);
      return res.json({ ok: true, board });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const board = await this.service.update(
        req.params.boardId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, board });
    } catch (error) {
      next(error);
    }
  }

  async archive(req, res, next) {
    try {
      await this.service.archive(req.params.boardId, req.user.uid);
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async createList(req, res, next) {
    try {
      const list = await this.service.createList(
        req.params.boardId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, list });
    } catch (error) {
      next(error);
    }
  }

  async updateList(req, res, next) {
    try {
      const list = await this.service.updateList(
        req.params.boardId,
        req.params.listId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, list });
    } catch (error) {
      next(error);
    }
  }

  async deleteList(req, res, next) {
    try {
      await this.service.deleteList(
        req.params.boardId,
        req.params.listId,
        req.user.uid,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async reorderLists(req, res, next) {
    try {
      await this.service.reorderLists(
        req.params.boardId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async createCard(req, res, next) {
    try {
      const card = await this.service.createCard(
        req.params.boardId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, card });
    } catch (error) {
      next(error);
    }
  }

  async moveCard(req, res, next) {
    try {
      await this.service.moveCard(
        req.params.boardId,
        req.params.cardId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async removeCard(req, res, next) {
    try {
      await this.service.removeCard(
        req.params.boardId,
        req.params.cardId,
        req.user.uid,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}