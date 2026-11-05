import { getFirestore, getStorage } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { serverTimestamp } from "../../shared/utils/index.js";
import ChannelRepository from "../channels/channel.repository.js";
import { isSafeId } from "../../shared/validation/ids.js";
import logger from "../../shared/utils/logger.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

function isAllowedContent(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (mimeType === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (mimeType === "text/plain") {
    if (buffer.includes(0)) return false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function cleanFileName(fileName) {
  const withoutControls = [...fileName.normalize("NFKC")]
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint >= 32 && codePoint !== 127;
    })
    .join("");
  const cleaned = withoutControls
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 120);
  return cleaned || "attachment";
}

export default class AttachmentRepository {
  constructor(
    db = getFirestore(),
    channelRepository = new ChannelRepository(db),
    storage = null,
  ) {
    this.db = db;
    this.channelRepository = channelRepository;
    this.storage = storage;
  }

  _bucket() {
    return (this.storage || getStorage()).bucket();
  }

  async upload(channelId, uid, uploadId, { buffer, fileName, mimeType }) {
    if (!isSafeId(uploadId)) {
      throw Errors.validation("Invalid upload identifier");
    }
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw Errors.validation("Choose a non-empty file to upload");
    }
    if (buffer.length > MAX_FILE_SIZE) {
      throw Errors.validation("Attachments must be 10 MB or smaller");
    }
    if (!FILE_TYPES.has(mimeType) || !isAllowedContent(buffer, mimeType)) {
      throw Errors.validation("This file type is not allowed");
    }

    const safeName = cleanFileName(fileName);
    const storagePath = `channels/${channelId}/${uploadId}`;
    const file = this._bucket().file(storagePath);
    const metadata = {
      id: uploadId,
      name: safeName,
      mimeType,
      size: buffer.length,
      storagePath,
      uploadedBy: uid,
      createdAt: serverTimestamp(),
    };
    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
        metadata: { channelId, uploadedBy: uid },
      },
    });
    try {
      await this.channelRepository.getAccess(channelId, uid, {
        requireMembership: true,
      });
      await channelRef.collection("uploads").doc(uploadId).create(metadata);
    } catch (error) {
      try {
        await file.delete({ ignoreNotFound: true });
      } catch (cleanupError) {
        logger.error("Failed to clean up an unregistered upload", {
          channelId,
          uploadId,
          error: cleanupError?.message,
        });
      }
      throw error;
    }
    return {
      id: uploadId,
      name: safeName,
      mimeType,
      size: buffer.length,
    };
  }

  async validateForAttach(channelId, uid, uploadIds) {
    if (!uploadIds.length) return [];
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    const documents = await Promise.all(
      uploadIds.map((uploadId) =>
        channelRef.collection("uploads").doc(uploadId).get(),
      ),
    );
    if (
      documents.some(
        (snapshot) =>
          !snapshot.exists || snapshot.get("uploadedBy") !== uid,
      )
    ) {
      throw Errors.forbidden(
        "You can only attach files you uploaded to this conversation",
      );
    }
    return documents.map((snapshot) => snapshot.id);
  }

  async getForMessages(channelId, uid, uploadIds) {
    if (!uploadIds?.length) return [];
    const { channelRef } = await this.channelRepository.getAccess(channelId, uid);
    const docs = await Promise.all(
      uploadIds.map((uploadId) =>
        channelRef.collection("uploads").doc(uploadId).get(),
      ),
    );
    return Promise.all(
      docs.map(async (snapshot) => {
        if (!snapshot.exists) {
          throw Errors.notFound("Message attachment is no longer available");
        }
        const data = snapshot.data();
        const [downloadUrl] = await this._bucket()
          .file(data.storagePath)
          .getSignedUrl({
            action: "read",
            expires: Date.now() + 5 * 60 * 1000,
          });
        return {
          id: snapshot.id,
          name: data.name,
          mimeType: data.mimeType,
          size: data.size,
          downloadUrl,
        };
      }),
    );
  }
}

export { FILE_TYPES, MAX_FILE_SIZE, isAllowedContent };
