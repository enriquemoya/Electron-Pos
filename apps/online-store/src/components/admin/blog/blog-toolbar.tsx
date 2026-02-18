"use client";

import type { Editor } from "@tiptap/react";
import type { ComponentType } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Heading4,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  SquareCode
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ToolbarLabels = {
  h2: string;
  h3: string;
  h4: string;
  bold: string;
  italic: string;
  bullet: string;
  ordered: string;
  code: string;
  quote: string;
  link: string;
  image: string;
};

function ToolbarButton({
  active,
  onClick,
  label,
  icon: Icon
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="gap-1"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}

export function BlogToolbar({
  editor,
  labels,
  onLink,
  onImage
}: {
  editor: Editor | null;
  labels: ToolbarLabels;
  onLink: () => void;
  onImage: () => void;
}) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-base-950/70 p-2">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label={labels.h2}
          icon={Heading2}
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label={labels.h3}
          icon={Heading3}
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          label={labels.h4}
          icon={Heading4}
        />
      </div>

      <div className="hidden h-7 w-px bg-white/15 md:block" />

      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label={labels.bold}
          icon={Bold}
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label={labels.italic}
          icon={Italic}
        />
      </div>

      <div className="hidden h-7 w-px bg-white/15 md:block" />

      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label={labels.bullet}
          icon={List}
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label={labels.ordered}
          icon={ListOrdered}
        />
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          label={labels.code}
          icon={SquareCode}
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label={labels.quote}
          icon={Quote}
        />
      </div>

      <div className="hidden h-7 w-px bg-white/15 md:block" />

      <div className="flex flex-wrap gap-2">
        <ToolbarButton active={false} onClick={onLink} label={labels.link} icon={LinkIcon} />
        <ToolbarButton active={false} onClick={onImage} label={labels.image} icon={Image} />
      </div>
    </div>
  );
}
