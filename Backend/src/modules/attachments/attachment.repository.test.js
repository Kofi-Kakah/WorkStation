import { describe, expect, it } from "vitest";
import AttachmentRepository, {
  isAllowedContent,
} from "./attachment.repository.js";

describe("AttachmentRepository content validation", () => {
  it("accepts files only when their bytes match the declared safe type", () => {
    expect(
      isAllowedContent(Buffer.from("%PDF-1.7\n", "ascii"), "application/pdf"),
    ).toBe(true);
    expect(
      isAllowedContent(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).toBe(true);
    expect(
      isAllowedContent(Buffer.from("%PDF-1.7\n", "ascii"), "image/png"),
    ).toBe(false);
  });

  it("rejects text with binary null bytes", () => {
    expect(
      isAllowedContent(Buffer.from([0x74, 0x00, 0x78]), "text/plain"),
    ).toBe(false);
  });

  it("rejects storage paths that could escape the channel prefix", async () => {
    const repository = new AttachmentRepository(
      {},
      {
        getAccess: async () => {
          throw new Error("access lookup must not run for an invalid ID");
        },
      },
      null,
    );

    await expect(
      repository.upload("channel-1", "member-1", "../../users/owner", {
        buffer: Buffer.from("%PDF-1.7\n", "ascii"),
        fileName: "report.pdf",
        mimeType: "application/pdf",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
