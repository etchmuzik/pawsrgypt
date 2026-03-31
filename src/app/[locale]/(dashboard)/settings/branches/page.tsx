import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, ArrowLeft, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Branch } from "@/lib/supabase/types";

async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Branch[]) ?? [];
}

export default async function BranchesPage() {
  const locale = await getLocale();
  const branches = await getBranches();

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
          <h1 className="text-2xl font-bold text-paws-brown-dark">Branches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your store locations
          </p>
        </div>
        <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      {/* Branch Cards */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-paws-sand p-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-paws-brown-dark">No branches yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first branch to start managing store locations.
              </p>
            </div>
            <Button size="sm" className="mt-2 gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4" /> Add Branch
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="border-paws-sand hover:border-paws-orange/50 hover:shadow-md transition-all"
            >
              <CardContent className="pt-2">
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-paws-brown-dark">{branch.name}</h3>
                      {branch.city && (
                        <p className="text-xs text-muted-foreground">{branch.city}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      branch.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                    }
                  >
                    {branch.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Branch Details */}
                <div className="space-y-2.5 mb-4">
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground" dir="ltr">
                        {branch.phone}
                      </span>
                    </div>
                  )}
                  {!branch.address && !branch.phone && (
                    <p className="text-sm text-muted-foreground italic">
                      No contact details added yet.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-paws-sand/50">
                  <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs flex-1 text-muted-foreground"
                  >
                    {branch.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {branches.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {branches.length} branch{branches.length !== 1 ? "es" : ""} total
          {" | "}
          {branches.filter((b) => b.is_active).length} active
        </p>
      )}
    </div>
  );
}
