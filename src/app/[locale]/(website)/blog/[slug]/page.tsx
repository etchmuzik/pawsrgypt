import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string;
  content_ar: string | null;
  featured_image: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts" as never)
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  const post = data as BlogPost | null;

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title_en,
    description: post.excerpt_en ?? undefined,
    openGraph: {
      title: post.title_en,
      description: post.excerpt_en ?? undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts" as never)
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  const post = data as BlogPost | null;

  if (!post) {
    notFound();
  }

  const title =
    locale === "ar" ? post.title_ar || post.title_en : post.title_en;
  const content =
    locale === "ar"
      ? post.content_ar || post.content_en
      : post.content_en;

  return (
    <div>
      {/* Back Link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href={`/${locale}/blog`}
          className="text-paws-orange font-semibold text-sm hover:underline"
        >
          &larr; Back to Blog
        </Link>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
          <div className="relative w-full max-h-[400px] overflow-hidden rounded-2xl">
            <Image
              src={post.featured_image}
              alt={title}
              width={1200}
              height={400}
              className="w-full object-cover max-h-[400px]"
            />
          </div>
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4">
          {title}
        </h1>

        {/* Meta */}
        <div className="text-sm text-neutral-400 mb-8">
          {post.author && <span>{post.author}</span>}
          {post.author && post.published_at && (
            <span className="mx-2">&middot;</span>
          )}
          {post.published_at && (
            <span>
              {new Date(post.published_at).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
          )}
        </div>

        <hr className="border-neutral-100 mb-8" />

        {/* Content */}
        <div className="prose prose-lg prose-neutral max-w-none">
          {content
            .split("\n")
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      </article>

      {/* Bottom Back Link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link
          href={`/${locale}/blog`}
          className="text-paws-orange font-semibold text-sm hover:underline"
        >
          &larr; Back to Blog
        </Link>
      </div>
    </div>
  );
}
