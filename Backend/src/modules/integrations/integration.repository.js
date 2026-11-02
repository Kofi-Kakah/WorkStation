import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { serverTimestamp } from "../../shared/utils/index.js";
import IssueRepository from "../issues/issue.repository.js";

export default class IntegrationRepository {
  constructor(db = getFirestore(), issueRepository = new IssueRepository(db)) {
    this.db = db;
    this.issueRepository = issueRepository;
  }

  async convertMessageToIssue(uid, input) {
    const channelRef = this.db.collection("channels").doc(input.channelId);
    const messageRef = channelRef.collection("messages").doc(input.messageId);

    return this.db.runTransaction(async (transaction) => {
      const [channelSnapshot, messageSnapshot] = await Promise.all([
        transaction.get(channelRef),
        transaction.get(messageRef),
      ]);

      if (
        !channelSnapshot.exists ||
        channelSnapshot.get("archived") ||
        !messageSnapshot.exists ||
        messageSnapshot.get("isDeleted")
      ) {
        throw Errors.notFound("Message not found");
      }

      const channel = channelSnapshot.data();
      const workspaceMemberRef = this.db
        .collection("workspaces")
        .doc(channel.workspaceId)
        .collection("members")
        .doc(uid);
      const channelMemberRef = channelRef.collection("members").doc(uid);
      const [workspaceMember, channelMember] = await Promise.all([
        transaction.get(workspaceMemberRef),
        transaction.get(channelMemberRef),
      ]);

      const requiresChannelMembership =
        channel.visibility === "private" || channel.type !== "channel";
      if (
        !workspaceMember.exists ||
        (requiresChannelMembership && !channelMember.exists)
      ) {
        throw Errors.notFound("Message not found");
      }

      const projectAccess =
        await this.issueRepository.getProjectAccessWithinTransaction(
          transaction,
          input.projectId,
          uid,
        );
      if (projectAccess.project.workspaceId !== channel.workspaceId) {
        throw Errors.forbidden(
          "Choose a project in the message's workspace",
        );
      }

      const message = messageSnapshot.data();
      if (message.linkedIssueId) {
        const linkedIssueRef = this.db
          .collection("issues")
          .doc(message.linkedIssueId);
        const linkedIssue = await transaction.get(linkedIssueRef);
        if (!linkedIssue.exists) {
          throw Errors.conflict("This message is already linked to an unavailable issue");
        }
        if (linkedIssue.get("projectId") !== input.projectId) {
          throw Errors.conflict("This message has already been converted in another project");
        }
        return {
          issue: { id: linkedIssue.id, ...linkedIssue.data() },
          alreadyConverted: true,
        };
      }

      const issue = await this.issueRepository.createWithinTransaction(
        transaction,
        input.projectId,
        uid,
        input,
        {
          projectAccess,
          sourceMessage: {
            channelId: input.channelId,
            messageId: input.messageId,
          },
        },
      );

      transaction.update(messageRef, {
        linkedIssueId: issue.id,
        linkedIssueKey: issue.issueKey,
        linkedIssueAt: serverTimestamp(),
      });

      return { issue, alreadyConverted: false };
    });
  }
}
