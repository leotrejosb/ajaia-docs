import { describe, expect, it } from "vitest";
import { fileToDocument, textToHtml, titleFromFilename } from "@/lib/import";
import { AppError } from "@/lib/errors";

describe("file import", () => {
  it("escapes HTML in plain text and keeps paragraph structure", () => {
    const html = textToHtml("Hello <script>alert(1)</script>\nline two\n\nSecond paragraph");
    expect(html).toBe(
      "<p>Hello &lt;script&gt;alert(1)&lt;/script&gt;<br>line two</p><p>Second paragraph</p>",
    );
  });

  it("converts markdown headings, emphasis and lists", async () => {
    const md = "# Plan\n\nSome **bold** and *italic*.\n\n- one\n- two\n\n1. first\n";
    const { title, html } = await fileToDocument("roadmap.md", Buffer.from(md));
    expect(title).toBe("roadmap");
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
  });

  it("rejects unsupported file types with a clear message", async () => {
    await expect(fileToDocument("photo.png", Buffer.from("x"))).rejects.toThrow(/Unsupported file type/);
    await expect(fileToDocument("photo.png", Buffer.from("x"))).rejects.toBeInstanceOf(AppError);
  });

  it("rejects files over 2 MB", async () => {
    await expect(fileToDocument("big.txt", Buffer.alloc(2 * 1024 * 1024 + 1))).rejects.toThrow(/2 MB/);
  });

  it("derives a safe title from the filename", () => {
    expect(titleFromFilename("C:\\docs\\Meeting notes.docx")).toBe("Meeting notes");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});
