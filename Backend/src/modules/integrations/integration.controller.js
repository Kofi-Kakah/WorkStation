import IntegrationService from "./integration.service.js";

export default class IntegrationController {
  constructor(service = new IntegrationService()) {
    this.service = service;
  }

  async convertMessageToIssue(req, res, next) {
    try {
      const result = await this.service.convertMessageToIssue(req.user.uid, {
        ...req.body,
        messageId: req.params.messageId,
      });
      return res.status(result.alreadyConverted ? 200 : 201).json({
        ok: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}