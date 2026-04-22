"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "ضيف عميل جديد" : "Add New Customer",
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
    create: isAr ? "إنشاء العميل" : "Create Customer",
    creating: isAr ? "بيتحفظ..." : "Creating...",
    nameRequired: isAr ? "اسم العميل مطلوب." : "Customer name is required.",
    creditInvalid: isAr ? "ادخل حد ائتمان صحيح." : "Please enter a valid credit limit.",
    ok: isAr ? "تم إنشاء العميل بنجاح!" : "Customer created successfully!",
  };

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    credit_limit: "0",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
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

    const insertData = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      credit_limit: creditLimit,
      balance: 0,
      notes: form.notes.trim() || null,
      is_active: true,
    };

    const { error } = await supabase.from("customers").insert(insertData as never);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(L.ok);
    router.push(`/${locale}/customers`);
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
        <h1 className="text-2xl font-bold text-paws-brown-dark">{L.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.info}</h2>

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

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/customers`}>
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
