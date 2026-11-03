import ProjectRepository from "../projects/project.repository.js";
import IssueRepository from "../issues/issue.repository.js";
import ChannelRepository from "../channels/channel.repository.js";
import MessageRepository from "../messages/message.repository.js";

const RESULT_LIMIT = 40;
const MESSAGE_SEARCH_SCOPE_LIMIT = 25;
const MESSAGE_RESULTS_PER_CHANNEL = 3;

function timestampMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default class SearchService {
  constructor(
    projectRepository = new ProjectRepository(),
    issueRepository = new IssueRepository(),
    channelRepository = new ChannelRepository(),
    messageRepository = new MessageRepository(),
  ) {
    this.projectRepository = projectRepository;
    this.issueRepository = issueRepository;
    this.channelRepository = channelRepository;
    this.messageRepository = messageRepository;
  }

  async search(workspaceId, uid, input) {
    const query = input.trim().toLocaleLowerCase();
    const [projects, channels, conversations] = await Promise.all([
      this.projectRepository.listForWorkspace(workspaceId, uid),
      this.channelRepository.listForWorkspace(workspaceId, uid),
      this.channelRepository.listConversations(workspaceId, uid),
    ]);
    const projectResults = projects
      .filter((project) =>
        `${project.name || ""} ${project.description || ""}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .map((project) => ({
        type: "project",
        id: project.id,
        title: project.name,
        subtitle: project.description || "Project",
        href: `/projects/${project.id}`,
      }));
    const issueGroups = await Promise.all(
      projects.map(async (project) =>
        this.issueRepository.list(project.id, uid, { search: input }),
      ),
    );
    const issueResults = issueGroups
      .flat()
      .map((issue) => ({
        type: "issue",
        id: issue.id,
        title: issue.title,
        subtitle: `${issue.issueKey || issue.id} · ${issue.status}`,
        href: `/issues/${issue.id}`,
      }));

    const channelResults = channels
      .filter((channel) =>
        `${channel.name || ""} ${channel.topic || ""}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .map((channel) => ({
        type: "channel",
        id: channel.id,
        title: `#${channel.name}`,
        subtitle: channel.topic || "Workspace channel",
        href: `/channels?channelId=${encodeURIComponent(channel.id)}`,
      }));
    const allConversations = [...channels, ...conversations].sort(
      (left, right) =>
        timestampMillis(right.lastMessageAt) -
        timestampMillis(left.lastMessageAt),
    );
    const accessibleConversations = allConversations.slice(
      0,
      MESSAGE_SEARCH_SCOPE_LIMIT,
    );
    const messageGroups = await Promise.all(
      accessibleConversations.map((channel) =>
        this.messageRepository.search(
          channel.id,
          uid,
          input,
          MESSAGE_RESULTS_PER_CHANNEL,
        ),
      ),
    );
    const messageResults = messageGroups.flatMap((messages, index) =>
      messages.map((message) => ({
        type: "message",
        id: `${accessibleConversations[index].id}:${message.id}`,
        title: message.content,
        subtitle: `${accessibleConversations[index].name || "Direct message"} · ${message.senderName || "Workspace member"}`,
        href: `/channels?channelId=${encodeURIComponent(accessibleConversations[index].id)}&messageId=${encodeURIComponent(message.id)}`,
      })),
    );

    const allResults = [
      ...projectResults,
      ...issueResults,
      ...channelResults,
      ...messageResults,
    ];
    return {
      results: allResults.slice(0, RESULT_LIMIT),
      limited:
        channels.length + conversations.length > MESSAGE_SEARCH_SCOPE_LIMIT ||
        messageGroups.some(
          (messages) => messages.length >= MESSAGE_RESULTS_PER_CHANNEL,
        ) ||
        allResults.length > RESULT_LIMIT,
    };
  }
}