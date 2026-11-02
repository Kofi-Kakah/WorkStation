import ChannelRepository from "./channel.repository.js";

export default class ChannelService {
  constructor(repository = new ChannelRepository()) {
    this.repository = repository;
  }

  list(workspaceId, uid) {
    return this.repository.listForWorkspace(workspaceId, uid);
  }

  create(uid, { workspaceId, ...input }) {
    return this.repository.create(workspaceId, uid, input);
  }

  join(channelId, uid) {
    return this.repository.join(channelId, uid);
  }

  get(channelId, uid) {
    return this.repository.getForUser(channelId, uid);
  }

  listConversations(workspaceId, uid) {
    return this.repository.listConversations(workspaceId, uid);
  }

  createConversation(uid, { workspaceId, ...input }) {
    return this.repository.createConversation(workspaceId, uid, input);
  }

  addMember(channelId, uid, targetUid) {
    return this.repository.addMember(channelId, uid, targetUid);
  }

  removeMember(channelId, uid, targetUid) {
    return this.repository.removeMember(channelId, uid, targetUid);
  }

  update(channelId, uid, updates) {
    return this.repository.update(channelId, uid, updates);
  }

  listMembers(channelId, uid) {
    return this.repository.listMembers(channelId, uid);
  }

  heartbeat(channelId, uid, input) {
    return this.repository.heartbeat(channelId, uid, input);
  }

  markRead(channelId, uid, messageId) {
    return this.repository.markRead(channelId, uid, messageId);
  }
}