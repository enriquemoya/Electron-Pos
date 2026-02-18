"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { BlogToolbar } from "@/components/admin/blog/blog-toolbar";
import { BlogStatusIndicator } from "@/components/admin/blog/blog-status-indicator";
import { BlogPreviewRenderer } from "@/components/admin/blog/blog-preview-renderer";

type AdminBlogPost = {
  id: string;
  slug: string;
  locale: "es" | "en";
  title: string;
  excerpt: string;
  contentJson: Record<string, unknown>;
  coverImageUrl: string | null;
  authorName: string;
  readingTimeMinutes: number;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type BlogEditorLabels = {
  title: string;
  subtitle: string;
  listTitle: string;
  newPost: string;
  search: string;
  slug: string;
  locale: string;
  postTitle: string;
  excerpt: string;
  authorName: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  saveDraft: string;
  publish: string;
  unpublish: string;
  uploadImage: string;
  delete: string;
  deleteConfirm: string;
  cancel: string;
  published: string;
  draft: string;
  preview: string;
  untitled: string;
  saving: string;
  saved: string;
  linkPrompt: string;
  slugLocked: string;
  bubbleBold: string;
  bubbleItalic: string;
  bubbleLink: string;
  toolbar: {
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
  toasts: {
    saveOk: string;
    saveError: string;
    publishOk: string;
    publishError: string;
    uploadOk: string;
    uploadError: string;
  };
};

const emptyDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "" }]
    }
  ]
};

function initialPost(locale: "es" | "en"): AdminBlogPost {
  return {
    id: "",
    slug: "",
    locale,
    title: "",
    excerpt: "",
    contentJson: emptyDocument,
    coverImageUrl: null,
    authorName: "DanimeZone",
    readingTimeMinutes: 1,
    seoTitle: "",
    seoDescription: "",
    isPublished: false,
    publishedAt: null,
    updatedAt: new Date().toISOString()
  };
}

export function BlogEditor({
  locale,
  initialPosts,
  labels
}: {
  locale: "es" | "en";
  initialPosts: AdminBlogPost[];
  labels: BlogEditorLabels;
}) {
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [selectedId, setSelectedId] = useState<string>(initialPosts[0]?.id || "new");
  const [model, setModel] = useState<AdminBlogPost>(initialPosts[0] || initialPost(locale));
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storageKey = useMemo(() => `blog-editor-draft-${locale}-${selectedId}`, [locale, selectedId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, codeBlock: false, blockquote: false }),
      Heading.configure({ levels: [2, 3, 4] }),
      BulletList,
      OrderedList,
      ListItem,
      CodeBlock,
      Blockquote,
      Link.configure({ openOnClick: false }),
      Image
    ],
    content: model.contentJson,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setModel((current) => ({ ...current, contentJson: currentEditor.getJSON() }));
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.commands.setContent(model.contentJson);
  }, [editor, model.id]);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AdminBlogPost>;
      setModel((current) => ({ ...current, ...parsed }));
      if (editor && parsed.contentJson) {
        editor.commands.setContent(parsed.contentJson);
      }
    } catch {
      // ignore invalid local draft
    }
  }, [storageKey, editor]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAutosaveStatus("saving");
      localStorage.setItem(storageKey, JSON.stringify(model));
      setAutosaveStatus("saved");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [model, storageKey]);

  const filteredPosts = posts.filter((post) =>
    [post.title, post.slug].some((value) => value.toLowerCase().includes(query.toLowerCase()))
  );

  const selectPost = async (id: string) => {
    if (id === "new") {
      setSelectedId("new");
      setModel(initialPost(locale));
      if (editor) {
        editor.commands.setContent(emptyDocument);
      }
      return;
    }

    const response = await fetch(`/api/admin/blog/posts/${id}`, { cache: "no-store" });
    if (!response.ok) {
      toast.error(labels.toasts.saveError);
      return;
    }
    const payload = (await response.json()) as { post: AdminBlogPost };
    setSelectedId(id);
    setModel(payload.post);
    if (editor) {
      editor.commands.setContent(payload.post.contentJson);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        slug: model.slug,
        locale: model.locale,
        title: model.title,
        excerpt: model.excerpt,
        contentJson: editor?.getJSON() || model.contentJson,
        coverImageUrl: model.coverImageUrl,
        authorName: model.authorName,
        seoTitle: model.seoTitle,
        seoDescription: model.seoDescription
      };

      const response = await fetch(
        model.id ? `/api/admin/blog/posts/${model.id}` : "/api/admin/blog/posts",
        {
          method: model.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        toast.error(labels.toasts.saveError);
        return;
      }

      const payload = (await response.json()) as { post: AdminBlogPost };
      setModel(payload.post);
      setSelectedId(payload.post.id);
      setPosts((current) => {
        const without = current.filter((post) => post.id !== payload.post.id);
        return [payload.post, ...without];
      });
      toast.success(labels.toasts.saveOk);
    } finally {
      setSaving(false);
    }
  };

  const publishAction = async (action: "publish" | "unpublish") => {
    if (!model.id) {
      await save();
      return;
    }

    const response = await fetch(`/api/admin/blog/posts/${model.id}/${action}`, {
      method: "POST"
    });

    if (!response.ok) {
      toast.error(labels.toasts.publishError);
      return;
    }

    const payload = (await response.json()) as { post: AdminBlogPost };
    setModel(payload.post);
    setPosts((current) => current.map((post) => (post.id === payload.post.id ? payload.post : post)));
    toast.success(labels.toasts.publishOk);
  };

  const deletePost = async () => {
    if (!model.id) {
      return;
    }
    const response = await fetch(`/api/admin/blog/posts/${model.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(labels.toasts.saveError);
      return;
    }
    setPosts((current) => current.filter((post) => post.id !== model.id));
    setSelectedId("new");
    setModel(initialPost(locale));
    editor?.commands.setContent(emptyDocument);
    toast.success(labels.toasts.saveOk);
    setDeleteDialogOpen(false);
  };

  const addLink = () => {
    const href = window.prompt(labels.linkPrompt);
    if (!href || !editor) {
      return;
    }
    editor.chain().focus().setLink({ href }).run();
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("folder", "blog");
    formData.append("file", file);

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      toast.error(labels.toasts.uploadError);
      return;
    }

    const payload = (await response.json()) as { url: string };
    setModel((current) => ({ ...current, coverImageUrl: current.coverImageUrl || payload.url }));
    editor?.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
    toast.success(labels.toasts.uploadOk);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">{labels.title}</h1>
        <p className="text-sm text-white/60">{labels.subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="space-y-3 border-white/10 bg-base-800/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">{labels.listTitle}</p>
            <Button size="sm" variant="outline" onClick={() => selectPost("new")}>{labels.newPost}</Button>
          </div>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} />
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left ${selectedId === post.id ? "border-amber-400 bg-base-900" : "border-white/10 bg-base-900/60"}`}
                onClick={() => selectPost(post.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">{post.title}</p>
                  <Badge>{post.isPublished ? labels.published : labels.draft}</Badge>
                </div>
                <p className="truncate text-xs text-white/60">/{post.locale}/blog/{post.slug}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 border-white/10 bg-base-800/60 p-4">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-white/10 bg-base-900/90 px-3 py-2 backdrop-blur">
            <BlogStatusIndicator
              status={autosaveStatus}
              isPublished={model.isPublished}
              publishedLabel={labels.published}
              draftLabel={labels.draft}
              savingLabel={labels.saving}
              savedLabel={labels.saved}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void save()}>{labels.saveDraft}</Button>
              <Button
                disabled={!model.id || model.isPublished}
                onClick={() => void publishAction("publish")}
              >
                {labels.publish}
              </Button>
              <Button
                disabled={!model.id || !model.isPublished}
                variant="outline"
                onClick={() => void publishAction("unpublish")}
              >
                {labels.unpublish}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>{labels.uploadImage}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!model.id} aria-label="post actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={!model.id || model.isPublished}
                    onClick={() => void publishAction("publish")}
                  >
                    {labels.publish}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!model.id || !model.isPublished}
                    onClick={() => void publishAction("unpublish")}
                  >
                    {labels.unpublish}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!model.id}
                    className="text-red-300 focus:text-red-200"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {labels.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.slug}</label>
              <Input
                value={model.slug}
                disabled={model.isPublished}
                onChange={(event) => setModel((current) => ({ ...current, slug: event.target.value }))}
              />
              {model.isPublished ? <p className="mt-1 text-xs text-white/50">{labels.slugLocked}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.locale}</label>
              <select
                className="w-full rounded-md border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
                value={model.locale}
                onChange={(event) => setModel((current) => ({ ...current, locale: event.target.value as "es" | "en" }))}
              >
                <option value="es">es</option>
                <option value="en">en</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.postTitle}</label>
              <Input value={model.title} onChange={(event) => setModel((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.excerpt}</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
                value={model.excerpt}
                onChange={(event) => setModel((current) => ({ ...current, excerpt: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.authorName}</label>
              <Input value={model.authorName} onChange={(event) => setModel((current) => ({ ...current, authorName: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.coverImageUrl}</label>
              <Input
                value={model.coverImageUrl || ""}
                onChange={(event) => setModel((current) => ({ ...current, coverImageUrl: event.target.value || null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.seoTitle}</label>
              <Input value={model.seoTitle} onChange={(event) => setModel((current) => ({ ...current, seoTitle: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-white/60">{labels.seoDescription}</label>
              <Input
                value={model.seoDescription}
                onChange={(event) => setModel((current) => ({ ...current, seoDescription: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-base-900/80 p-3">
            <BlogToolbar editor={editor} labels={labels.toolbar} onLink={addLink} onImage={() => fileInputRef.current?.click()} />
            {editor ? (
              <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="rounded-lg border border-white/10 bg-base-900/95 p-1 shadow-xl">
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={editor.isActive("bold") ? "default" : "outline"} onClick={() => editor.chain().focus().toggleBold().run()}>
                    {labels.bubbleBold}
                  </Button>
                  <Button type="button" size="sm" variant={editor.isActive("italic") ? "default" : "outline"} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    {labels.bubbleItalic}
                  </Button>
                  <Button type="button" size="sm" variant={editor.isActive("link") ? "default" : "outline"} onClick={addLink}>
                    {labels.bubbleLink}
                  </Button>
                </div>
              </BubbleMenu>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadImage(file);
                }
                event.currentTarget.value = "";
              }}
            />
            <EditorContent editor={editor} className="min-h-[360px] rounded-md border border-white/10 bg-base-900 p-3" />
          </div>

          <BlogPreviewRenderer
            contentJson={(editor?.getJSON() as Record<string, unknown>) || model.contentJson}
            title={model.title}
            excerpt={model.excerpt}
            previewLabel={labels.preview}
            untitledLabel={labels.untitled}
          />
        </Card>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.delete}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">{labels.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="default"
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={!model.id}
                onClick={() => void deletePost()}
              >
                {labels.delete}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
