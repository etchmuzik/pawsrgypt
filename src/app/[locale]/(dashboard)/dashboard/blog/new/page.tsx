"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface BlogForm {
  title_en: string;
  title_ar: string;
  slug: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: string;
  content_ar: string;
  featured_image: string;
  author: string;
  is_published: boolean;
}

const INITIAL_FORM: BlogForm = {
  title_en: "",
  title_ar: "",
  slug: "",
  excerpt_en: "",
  excerpt_ar: "",
  content_en: "",
  content_ar: "",
  featured_image: "",
  author: "PAWS Egypt",
  is_published: false,
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewBlogPostPage() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<BlogForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleBlur() {
    if (form.title_en && !form.slug) {
      updateField("slug", generateSlug(form.title_en));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title_en.trim() || !form.slug.trim() || !form.content_en.trim()) {
      toast.error("Please fill in the required fields: Title (EN), Slug, and Content (EN).");
      return;
    }

    setLoading(true);

    const payload = {
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim() || null,
      slug: form.slug.trim(),
      excerpt_en: form.excerpt_en.trim() || null,
      excerpt_ar: form.excerpt_ar.trim() || null,
      content_en: form.content_en.trim(),
      content_ar: form.content_ar.trim() || null,
      featured_image: form.featured_image.trim() || null,
      author: form.author.trim() || "PAWS Egypt",
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("blog_posts")
      .insert(payload as never);

    setLoading(false);

    if (error) {
      toast.error(`Failed to create post: ${error.message}`);
      return;
    }

    toast.success("Blog post created successfully!");
    router.push(`/${locale}/dashboard/blog`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/dashboard/blog`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Create Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-paws-sand/50 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-900">Basic Info</h2>

          <div className="space-y-2">
            <Label htmlFor="title_en">Title (EN) *</Label>
            <Input
              id="title_en"
              value={form.title_en}
              onChange={(e) => updateField("title_en", e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Post title in English"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_ar">Title (AR)</Label>
            <Input
              id="title_ar"
              value={form.title_ar}
              onChange={(e) => updateField("title_ar", e.target.value)}
              placeholder="Post title in Arabic"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="post-url-slug"
              required
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-paws-sand/50 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-900">Content</h2>

          <div className="space-y-2">
            <Label htmlFor="content_en">Content (EN) *</Label>
            <Textarea
              id="content_en"
              value={form.content_en}
              onChange={(e) => updateField("content_en", e.target.value)}
              placeholder="Write your post content in English..."
              className="min-h-[300px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_ar">Content (AR)</Label>
            <Textarea
              id="content_ar"
              value={form.content_ar}
              onChange={(e) => updateField("content_ar", e.target.value)}
              placeholder="Write your post content in Arabic..."
              className="min-h-[300px]"
              dir="rtl"
            />
          </div>
        </div>

        {/* Excerpt & Media */}
        <div className="bg-white rounded-2xl border border-paws-sand/50 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-900">Excerpt & Media</h2>

          <div className="space-y-2">
            <Label htmlFor="excerpt_en">Excerpt (EN)</Label>
            <Textarea
              id="excerpt_en"
              value={form.excerpt_en}
              onChange={(e) => updateField("excerpt_en", e.target.value)}
              placeholder="Short summary in English..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt_ar">Excerpt (AR)</Label>
            <Textarea
              id="excerpt_ar"
              value={form.excerpt_ar}
              onChange={(e) => updateField("excerpt_ar", e.target.value)}
              placeholder="Short summary in Arabic..."
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured_image">Featured Image URL</Label>
            <Input
              id="featured_image"
              value={form.featured_image}
              onChange={(e) => updateField("featured_image", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={form.author}
              onChange={(e) => updateField("author", e.target.value)}
              placeholder="Author name"
            />
          </div>
        </div>

        {/* Publishing */}
        <div className="bg-white rounded-2xl border border-paws-sand/50 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-900">Publishing</h2>
          <div className="flex items-center gap-3">
            <Switch
              id="is_published"
              checked={form.is_published}
              onCheckedChange={(checked) => updateField("is_published", checked)}
            />
            <Label htmlFor="is_published">Publish immediately</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/blog`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-paws-orange hover:bg-paws-orange/90 text-white"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
