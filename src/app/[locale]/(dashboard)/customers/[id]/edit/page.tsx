"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Customer } from "@/lib/supabase/types";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "تعديل العميل" : "Edit Customer",
    info: isAr ? "بيانات العميل" : "Customer Information",
    name: isAr ? "الاسم" : "Name",
    phone: isAr ? "الموبايل" : "Phone",
    email: isAr ? "الإيميل" : "Email",
    address: isAr ? "العنوان" : "Address",
    credit: isAr ? "حد الائتمان" : "Credit Limit",
    notes: isAr ? "ملاحظات" : "Notes",
    egp: isAr ? "ج.م" : "EGP",
    namePh: isAr ? "الاسم بالكامل" : "Customer full name",
    addressPh: isAr ? "العنوان بالكامل" : "Full address",
    notesPh: isAr ? "أي ملاحظات إضافية على العميل" : "Any additional notes about this customer",
    cancel: isAr ? "إلغاء" : "Cancel",
    saveChanges: isAr ? "حفظ التغييرات" : "Save Changes",
    saving: isAr ? "بيتحفظ..." : "Saving...",
    nameRequired: isAr ? "اسم العميل مطلوب." : "Customer name is required.",
    creditInvalid: isAr ? "ادخل حد ائتمان صحيح." : "Please enter a valid credit limit.",
    notFound: isAr ? "العميل مش موجود" : "Customer not found",
    updateFailed: isAr ? "فشل تحديث العميل" : "Failed to update customer",
    ok: isAr ? "تم تحديث العميل بنجاح!" : "Customer updated successfully!",
    status: isAr ? "حالة التفعيل" : "Active Status",
    statusNote: isAr ? "العميل يظهر لما يكون مفعل" : "Customer will be visible when active",
  };

  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    credit_limit: "0",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    async function loadCustomer() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error(L.notFound);
        router.push(`/${locale}/customers`);
        return;
      }

      const customer = data as Customer;

      setForm({
        name: customer.name ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        credit_limit: customer.credit_limit?.toString() ?? "0",
        notes: customer.notes ?? "",
        is_active: customer.is_active ?? true,
      });

      setFetching(false);
    }

    loadCustomer();
  }, [supabase, id, locale, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateField(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(L.nameRequired);
      return;
    }

    const creditLimit = parseFloat(form.credit_limit);
    if (isNaN(creditLimit) || creditLimit < 0) {
      toast.error(L.creditInvalid);
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      credit_limit: creditLimit,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };

    const { error } = await supabase
      .from("customers")
      .update(payload as never)
      .eq("id", id);

    setLoading(false);

    if (error) {
      toast.error(error.message ?? L.updateFailed);
      return;
    }

    toast.success(L.ok);
    router.push(`/${locale}/customers`);
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-paws-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/customers`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-paws-brown"
          >
            <ArrowLeft className="w-4 h-4" /> {L.back}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">
          {L.title}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            {L.info}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{L.name} *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={L.namePh}
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

            <div className="space-y-1.5">
              <Label htmlFor="email">{L.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="customer@example.com"
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="credit_limit">{L.credit} ({L.egp})</Label>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                min="0"
                step="0.01"
                value={form.credit_limit}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-white border-paws-sand"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">{L.address}</Label>
            <Textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={L.addressPh}
              className="bg-white border-paws-sand"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{L.notes}</Label>
            <Textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder={L.notesPh}
              className="bg-white border-paws-sand"
            />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{L.status}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {L.statusNote}
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked: boolean) =>
                updateField("is_active", checked)
              }
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/customers`}>
            <Button type="button" variant="outline" className="border-paws-sand">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? L.saving : L.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  );
}
