import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import type { Employee } from "@/lib/supabase/types";
import Link from "next/link";

interface HRPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HRPage({ params }: HRPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Human Resources</h1>
        <Link href={`/${locale}/hr/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Name</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Department</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Position</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Hire Date</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Base Salary</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!employees || employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No employees yet.
                </td>
              </tr>
            ) : (
              (employees as Employee[]).map((emp) => (
                <tr key={emp.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.position ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.hire_date}</td>
                  <td className="px-4 py-3 font-bold">{emp.salary_base} EGP</td>
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/hr/${emp.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-paws-orange hover:text-paws-orange/80">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
