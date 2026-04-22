"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BranchOption {
  id: string;
  name: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "ضيف موظف جديد" : "Add New Employee",
    personal: isAr ? "البيانات الشخصية" : "Personal Information",
    fullName: isAr ? "الاسم بالكامل" : "Full Name",
    phone: isAr ? "الموبايل" : "Phone",
    email: isAr ? "الإيميل" : "Email",
    job: isAr ? "بيانات الوظيفة" : "Job Details",
    department: isAr ? "القسم" : "Department",
    position: isAr ? "المنصب" : "Position",
    hireDate: isAr ? "تاريخ التعيين" : "Hire Date",
    branch: isAr ? "الفرع" : "Branch",
    selectBranch: isAr ? "اختار الفرع" : "Select branch",
    baseSalary: isAr ? "المرتب الأساسي" : "Base Salary",
    egp: isAr ? "ج.م" : "EGP",
    fullNamePh: isAr ? "الاسم بالكامل" : "Employee full name",
    deptPh: isAr ? "مثلا: مبيعات، مخزن" : "e.g. Sales, Warehouse",
    positionPh: isAr ? "مثلا: مدير، كاشير" : "e.g. Manager, Cashier",
    cancel: isAr ? "إلغاء" : "Cancel",
    create: isAr ? "إنشاء الموظف" : "Create Employee",
    creating: isAr ? "بيتحفظ..." : "Creating...",
    nameRequired: isAr ? "اسم الموظف مطلوب." : "Employee name is required.",
    branchRequired: isAr ? "اختار فرع من فضلك." : "Please select a branch.",
    salaryInvalid: isAr ? "ادخل مرتب صحيح." : "Please enter a valid base salary.",
    hireDateRequired: isAr ? "ادخل تاريخ التعيين." : "Please enter a hire date.",
    ok: isAr ? "تم إنشاء الموظف بنجاح!" : "Employee created successfully!",
  };

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    hire_date: new Date().toISOString().split("T")[0],
    salary_base: "",
    branch_id: "",
  });

  useEffect(() => {
    async function loadBranches() {
      const { data } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (data) {
        setBranches(data);
      }
    }
    loadBranches();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error(L.nameRequired);
      return;
    }

    if (!form.branch_id) {
      toast.error(L.branchRequired);
      return;
    }

    const salaryBase = parseFloat(form.salary_base);
    if (isNaN(salaryBase) || salaryBase < 0) {
      toast.error(L.salaryInvalid);
      return;
    }

    if (!form.hire_date) {
      toast.error(L.hireDateRequired);
      return;
    }

    setLoading(true);

    const insertData = {
      user_id: null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      department: form.department.trim() || null,
      position: form.position.trim() || null,
      hire_date: form.hire_date,
      salary_base: salaryBase,
      branch_id: form.branch_id,
      is_active: true,
    };

    const { error } = await supabase.from("employees").insert(insertData as never);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(L.ok);
    router.push(`/${locale}/hr`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/hr`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-paws-brown"
          >
            <ArrowLeft className="w-4 h-4" /> {L.back}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">{L.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.personal}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">{L.fullName} *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder={L.fullNamePh}
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{L.phone}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="email">{L.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="employee@pawsegypt.com"
                className="bg-white border-paws-sand"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.job}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="department">{L.department}</Label>
              <Input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder={L.deptPh}
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">{L.position}</Label>
              <Input
                id="position"
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder={L.positionPh}
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hire_date">{L.hireDate} *</Label>
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                value={form.hire_date}
                onChange={handleChange}
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch_id">{L.branch} *</Label>
              <select
                id="branch_id"
                name="branch_id"
                value={form.branch_id}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                required
              >
                <option value="">{L.selectBranch}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary_base">{L.baseSalary} ({L.egp}) *</Label>
              <Input
                id="salary_base"
                name="salary_base"
                type="number"
                min="0"
                step="0.01"
                value={form.salary_base}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-white border-paws-sand"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/hr`}>
            <Button type="button" variant="outline" className="border-paws-sand">
              {L.cancel}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? L.creating : L.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
