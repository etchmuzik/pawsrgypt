import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowLeft, Filter } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Profile, Branch } from "@/lib/supabase/types";

const ROLE_STYLES: Record<Profile["role"], { bg: string; text: string }> = {
  admin: { bg: "bg-red-100", text: "text-red-700" },
  manager: { bg: "bg-purple-100", text: "text-purple-700" },
  cashier: { bg: "bg-blue-100", text: "text-blue-700" },
  warehouse: { bg: "bg-amber-100", text: "text-amber-700" },
  accountant: { bg: "bg-emerald-100", text: "text-emerald-700" },
  hr: { bg: "bg-pink-100", text: "text-pink-700" },
};

interface ProfileWithBranch extends Profile {
  branches: Pick<Branch, "name"> | null;
}

async function getProfiles(role?: string): Promise<ProfileWithBranch[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*, branches(name)")
    .order("created_at", { ascending: false });

  if (role && role !== "all") {
    query = query.eq("role", role);
  }

  const { data } = await query;
  return (data as ProfileWithBranch[]) ?? [];
}

async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return (data as Branch[]) ?? [];
}

interface UsersPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const roleFilter = params.role ?? "all";

  const [profiles, branches] = await Promise.all([
    getProfiles(roleFilter),
    getBranches(),
  ]);

  const roles: Array<{ value: string; label: string }> = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "cashier", label: "Cashier" },
    { value: "warehouse", label: "Warehouse" },
    { value: "accountant", label: "Accountant" },
    { value: "hr", label: "HR" },
  ];

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-paws-brown-dark">Users Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage team members and their access levels
          </p>
        </div>
        <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5 flex-wrap">
          {roles.map((r) => (
            <Link key={r.value} href={`/${locale}/settings/users${r.value === "all" ? "" : `?role=${r.value}`}`}>
              <Button
                variant={roleFilter === r.value ? "default" : "outline"}
                size="sm"
                className={
                  roleFilter === r.value
                    ? "h-7 text-xs bg-paws-orange hover:bg-paws-orange/90 text-white"
                    : "h-7 text-xs border-paws-sand"
                }
              >
                {r.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Name</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Email</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Role</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Branch</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Status</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-paws-brown-dark">No users found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {roleFilter !== "all"
                          ? `No users with the "${roleFilter}" role. Try a different filter.`
                          : "Add your first team member to get started."}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              profiles.map((profile) => {
                const roleStyle = ROLE_STYLES[profile.role];
                const branchName = profile.branch_id
                  ? (profile.branches?.name ?? branchMap.get(profile.branch_id) ?? "Unknown")
                  : "Unassigned";

                return (
                  <tr
                    key={profile.id}
                    className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-paws-cream flex items-center justify-center text-xs font-bold text-paws-brown">
                          {(profile.full_name ?? profile.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-paws-brown-dark">
                          {profile.full_name ?? "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`${roleStyle.bg} ${roleStyle.text} hover:${roleStyle.bg} capitalize`}
                      >
                        {profile.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{branchName}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={
                          profile.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                        }
                      >
                        {profile.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                        >
                          {profile.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table></div>
      </div>

      {/* Summary */}
      {profiles.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Showing {profiles.length} user{profiles.length !== 1 ? "s" : ""}
          {roleFilter !== "all" ? ` with role "${roleFilter}"` : ""}
        </p>
      )}
    </div>
  );
}
