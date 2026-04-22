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

export default function NewSupplierPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "ضيف مورد جديد" : "Add New Supplier",
    info: isAr ? "بيانات المورد" : "Supplier Information",
    name: isAr ? "الاسم" : "Name",
    namePh: isAr ? "اسم المورد" : "Supplier name",
    phone: isAr ? "الموبايل" : "Phone",
    email: isAr ? "الإيميل" : "Email",
    taxId: isAr ? "رقم ضريبي" : "Tax ID",
    taxIdPh: isAr ? "رقم التسجيل الضريبي" : "Tax registration number",
    address: isAr ? "العنوان" : "Address",
    addressPh: isAr ? "العنوان بالكامل" : "Full address",
    notes: isAr ? "ملاحظات" : "Notes",
    notesPh: isAr ? "أي ملاحظات إضافية على المورد" : "Any additional notes about this supplier",
    cancel: isAr ? "إلغاء" : "Cancel",
    create: isAr ? "إنشاء المورد" : "Create Supplier",
    creating: isAr ? "بيتحفظ..." : "Creating...",
    nameRequired: isAr ? "اسم المورد مطلوب." : "Supplier name is required.",
    ok: isAr ? "تم إنشاء المورد بنجاح!" : "Supplier created successfully!",
  };

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
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

    setLoading(true);

    const { error } = await supabase.from("suppliers").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      tax_id: form.tax_id.trim() || null,
      balance: 0,
      notes: form.notes.trim() || null,
      is_active: true,
    } as never);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(L.ok);
    router.push(`/${locale}/purchases/suppliers`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/purchases/suppliers`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-paws-brown">
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
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder={L.namePh} className="bg-white border-paws-sand" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{L.phone}</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx" className="bg-white border-paws-sand" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{L.email}</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="supplier@example.com" className="bg-white border-paws-sand" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax_id">{L.taxId}</Label>
              <Input id="tax_id" name="tax_id" value={form.tax_id} onChange={handleChange} placeholder={L.taxIdPh} className="bg-white border-paws-sand" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">{L.address}</Label>
            <Textarea id="address" name="address" value={form.address} onChange={handleChange} placeholder={L.addressPh} className="bg-white border-paws-sand" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{L.notes}</Label>
            <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder={L.notesPh} className="bg-white border-paws-sand" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/purchases/suppliers`}>
            <Button type="button" variant="outline" className="border-paws-sand">{L.cancel}</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? L.creating : L.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
