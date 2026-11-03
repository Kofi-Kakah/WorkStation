import SearchService from "./search.service.js";

export default class SearchController {
  constructor(service = new SearchService()) {
    this.service = service;
  }

  async search(req, res, next) {
    try {
      const searchResult = await this.service.search(
        req.query.workspaceId,
        req.user.uid,
        req.query.query,
      );
      return res.json({ ok: true, ...searchResult });
    } catch (error) {
      next(error);
    }
  }
}