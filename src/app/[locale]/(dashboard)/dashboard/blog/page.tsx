import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/supabase/types";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  const posts = (data as BlogPost[] | null) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Blog</h1>
        <Link href={`/${locale}/dashboard/blog/new`}>
          <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Post
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          className="pl-9 bg-white border-neutral-200"
        />
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No blog posts yet. Add your first post.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Author
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">
                        {post.title_en}
                      </p>
                      {post.title_ar && (
                        <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
                          {post.title_ar}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.author}
                    </td>
                    <td className="px-4 py-3">
                      {post.is_published ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/dashboard/blog/${post.id}/edit`}
                        className="text-paws-orange hover:text-paws-orange/80"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
