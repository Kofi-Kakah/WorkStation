import MessageRepository from "./message.repository.js";

export default class MessageService {
  constructor(repository = new MessageRepository()) {
    this.repository = repository;
  }

  list(channelId, uid, options) {
    return this.repository.list(channelId, uid, options);
  }

  get(channelId, messageId, uid) {
    return this.repository.get(channelId, messageId, uid);
  }

  create(channelId, uid, input) {
    return this.repository.create(channelId, uid, input);
  }

  update(channelId, messageId, uid, input) {
    return this.repository.update(channelId, messageId, uid, input);
  }

  remove(channelId, messageId, uid) {
    return this.repository.remove(channelId, messageId, uid);
  }

  toggleReaction(channelId, messageId, uid, emoji) {
    return this.repository.toggleReaction(channelId, messageId, uid, emoji);
  }

  search(channelId, uid, query, limit) {
    return this.repository.search(channelId, uid, query, limit);
  }

  subscribe(channelId, uid, onChange, onError) {
    return this.repository.subscribe(channelId, uid, onChange, onError);
  }
}