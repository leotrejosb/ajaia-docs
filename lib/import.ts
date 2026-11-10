import { marked } from "marked";
import { badRequest } from "./errors";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function extensionOf(filename: string) {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function titleFromFilename(filename: string) {
  const base = filename.replace(/^.*[\\/]/, "");
  const i = base.lastIndexOf(".");
  // i === 0 means a dotfile like ".md": there is no real name, only an extension.
  const stem = (i > 0 ? base.slice(0, i) : i === 0 ? "" : base).trim();
  return (stem || "Imported document").slice(0, 200);
}

/** Plain text: blank lines split paragraphs, single newlines become <br>. Everything is escaped. */
export function textToHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function markdownToHtml(md: string) {
  return marked.parse(md, { async: false, gfm: true }) as string;
}

export async function fileToDocument(filename: string, buffer: Buffer) {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw badRequest(`Unsupported file type "${ext || "none"}". Use .txt, .md or .docx.`);
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw badRequest("File is larger than 2 MB");
  }

  let html: string;
  if (ext === ".txt") {
    html = textToHtml(buffer.toString("utf8"));
  } else if (ext === ".md" || ext === ".markdown") {
    html = markdownToHtml(buffer.toString("utf8"));
  } else {
    const mammoth = await import("mammoth");
    try {
      const result = await mammoth.convertToHtml({ buffer });
      html = result.value;
    } catch {
      throw badRequest("Could not read that .docx file. Is it a valid Word document?");
    }
  }

  return { title: titleFromFilename(filename), html };
}
