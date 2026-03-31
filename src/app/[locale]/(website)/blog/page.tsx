import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Blog",
};

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts" as never)
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[] | null) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="bg-neutral-900 text-white py-16 md:py-24 text-center">
        <p className="uppercase tracking-[0.2em] text-paws-orange text-sm mb-4">
          PAWS EGYPT BLOG
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          {locale === "ar" ? "المدونة" : "Blog"}
        </h1>
        <p className="text-neutral-400 max-w-xl mx-auto">
          Stories, tips, and news from PAWS Egypt
        </p>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-24">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition"
              >
                {/* Featured Image */}
                {post.featured_image ? (
                  <div className="aspect-[16/9] relative">
                    <Image
                      src={post.featured_image}
                      alt={
                        locale === "ar"
                          ? post.title_ar || post.title_en
                          : post.title_en
                      }
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-paws-orange/10 to-paws-orange/5 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-paws-orange/40" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 md:p-6">
                  <div className="text-xs text-neutral-400 mb-2">
                    {post.author && <span>{post.author}</span>}
                    {post.author && post.published_at && (
                      <span className="mx-1">&middot;</span>
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
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {locale === "ar"
                      ? post.title_ar || post.title_en
                      : post.title_en}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-3 mb-4">
                    {locale === "ar"
                      ? post.excerpt_ar || post.excerpt_en
                      : post.excerpt_en}
                  </p>
                  <span className="text-paws-orange font-semibold text-sm">
                    Read More &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg">
              {locale === "ar"
                ? "لا توجد مقالات حتى الآن"
                : "No blog posts yet. Check back soon!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
