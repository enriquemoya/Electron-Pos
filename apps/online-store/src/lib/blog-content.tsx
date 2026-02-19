import type { ReactNode } from "react";

type TiptapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: TiptapNode[];
};

export type BlogHeading = {
  id: string;
  level: number;
  text: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractText(node: TiptapNode): string {
  if (node.type === "text") {
    return node.text || "";
  }
  return (node.content || []).map(extractText).join("");
}

function renderTextNode(node: TiptapNode, key: string): ReactNode {
  let content: ReactNode = node.text || "";
  (node.marks || []).forEach((mark) => {
    if (mark.type === "bold") {
      content = <strong key={`${key}-bold`}>{content}</strong>;
    }
    if (mark.type === "italic") {
      content = <em key={`${key}-italic`}>{content}</em>;
    }
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      content = (
        <a key={`${key}-link`} href={href} className="text-amber-300 underline" target="_blank" rel="noreferrer noopener">
          {content}
        </a>
      );
    }
  });
  return content;
}

function renderNode(node: TiptapNode, key: string, headings: BlogHeading[]): ReactNode {
  const children = (node.content || []).map((child, index) => renderNode(child, `${key}-${index}`, headings));

  switch (node.type) {
    case "text":
      return <span key={key}>{renderTextNode(node, key)}</span>;
    case "paragraph":
      return <p key={key} className="leading-7 text-white/90">{children}</p>;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const safeLevel = level >= 2 && level <= 4 ? level : 2;
      const text = extractText(node);
      const id = slugify(text) || `section-${key}`;
      headings.push({ id, level: safeLevel, text });
      if (safeLevel === 2) {
        return <h2 key={key} id={id} className="mt-8 text-2xl font-semibold text-white">{children}</h2>;
      }
      if (safeLevel === 3) {
        return <h3 key={key} id={id} className="mt-6 text-xl font-semibold text-white">{children}</h3>;
      }
      return <h4 key={key} id={id} className="mt-5 text-lg font-semibold text-white">{children}</h4>;
    }
    case "bulletList":
      return <ul key={key} className="list-disc space-y-2 pl-6 text-white/90">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="list-decimal space-y-2 pl-6 text-white/90">{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key} className="border-l-2 border-amber-400/70 pl-4 italic text-white/80">{children}</blockquote>;
    case "codeBlock":
      return <pre key={key} className="overflow-x-auto rounded-lg border border-white/10 bg-base-900 p-4 text-sm text-white/90">{extractText(node)}</pre>;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) {
        return null;
      }
      return <img key={key} src={src} alt={alt} className="my-4 w-full rounded-xl border border-white/10" />;
    }
    case "hardBreak":
      return <br key={key} />;
    default:
      return null;
  }
}

export function renderBlogContent(contentJson: Record<string, unknown>) {
  const doc = contentJson as TiptapNode;
  const headings: BlogHeading[] = [];
  const content = (doc.content || []).map((node, index) => renderNode(node, `n-${index}`, headings));
  return {
    content,
    headings
  };
}
