import { randomUUID } from "node:crypto";
import AttachmentRepository from "./attachment.repository.js";

export default class AttachmentController {
  constructor(repository = new AttachmentRepository()) {
    this.repository = repository;
  }

  async upload(req, res, next) {
    try {
      if (!Buffer.isBuffer(req.body)) {
        return res.status(400).json({ error: "Upload body must be binary data" });
      }
      const fileType = req.headers["x-file-type"];
      if (typeof fileType !== "string" || !fileType) {
        return res.status(400).json({ error: "Missing attachment file type" });
      }
      let fileName;
      try {
        fileName = decodeURIComponent(req.headers["x-file-name"] || "");
      } catch {
        return res.status(400).json({ error: "Invalid attachment file name" });
      }
      const attachment = await this.repository.upload(
        req.params.channelId,
        req.user.uid,
        randomUUID(),
        {
          buffer: req.body,
          fileName,
          mimeType: fileType,
        },
      );
      return res.status(201).json({ ok: true, attachment });
    } catch (error) {
      next(error);
    }
  }
}
