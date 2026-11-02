import { randomBytes } from "node:crypto";
import { Errors } from "../../shared/errors/index.js";
import InvitationRepository from "./invitation.repository.js";

export default class InvitationService {
  constructor(repository = new InvitationRepository()) {
    this.repository = repository;
  }

  list(workspaceId, actorUid) {
    return this.repository.listForWorkspace(workspaceId, actorUid);
  }

  async create(workspaceId, actorUid, { email, role }) {
    const token = randomBytes(32).toString("base64url");
    const invitation = await this.repository.create(workspaceId, actorUid, {
      token,
      email: email.trim().toLowerCase(),
      role,
    });
    return { ...invitation, token };
  }

  respond(token, actor, action) {
    if (!actor.email || !actor.emailVerified) {
      throw Errors.forbidden(
        "Verify your email address before responding to an invitation",
      );
    }
    return this.repository.respond(token, actor.uid, actor.email, action);
  }
}