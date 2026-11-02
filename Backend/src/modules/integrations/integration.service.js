import IntegrationRepository from "./integration.repository.js";

export default class IntegrationService {
  constructor(repository = new IntegrationRepository()) {
    this.repository = repository;
  }

  convertMessageToIssue(uid, input) {
    return this.repository.convertMessageToIssue(uid, input);
  }
}