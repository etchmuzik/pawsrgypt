"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export interface VariantRow {
  // Existing variant id, or null for a new (unsaved) row.
  id: string | null;
  size: string;
  weight: string;
  color: string;
  price: string;
  cost_price: string;
  barcode: string;
  is_active: boolean;
  // Per-variant stock for the selected warehouse.
  stock_row_id: string | null;
  quantity: string;
  min_qty: string;
}

export function newVariantRow(): VariantRow {
  return {
    id: null,
    size: "",
    weight: "",
    color: "",
    price: "",
    cost_price: "",
    barcode: "",
    is_active: true,
    stock_row_id: null,
    quantity: "0",
    min_qty: "0",
  };
}

interface VariantEditorProps {
  variants: VariantRow[];
  onVariantsChange: (next: VariantRow[]) => void;
  warehouses: Array<{ id: string; name: string }>;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  isAr: boolean;
}

export function VariantEditor({
  variants,
  onVariantsChange,
  warehouses,
  warehouseId,
  onWarehouseChange,
  isAr,
}: VariantEditorProps) {
  const L = {
    sellingPrice: isAr ? "سعر البيع" : "Selling Price",
    costPrice: isAr ? "سعر التكلفة" : "Cost Price",
    egp: isAr ? "ج.م" : "EGP",
  };

  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    onVariantsChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    onVariantsChange([...variants, newVariantRow()]);
  }

  function removeVariant(idx: number) {
    const next = variants.filter((_, i) => i !== idx);
    onVariantsChange(next.length === 0 ? [newVariantRow()] : next);
  }

  return (
    <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            {isAr ? "المتغيرات (الأحجام / النكهات)" : "Variants (sizes / flavors)"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? "كل متغير له سعر ومخزون مستقل. اترك الحجم/النكهة فاضي لو المنتج له نسخة واحدة بس."
              : "Each variant has its own price and stock. Leave size/flavor empty if the product has a single version."}
          </p>
        </div>
        <div className="space-y-1.5 shrink-0 min-w-[180px]">
          <Label htmlFor="warehouse_id">{isAr ? "المستودع" : "Warehouse"}</Label>
          {warehouses.length === 0 ? (
            <p className="text-xs text-red-600 pt-2">
              {isAr ? "ضيف مستودع أولاً" : "Create a warehouse first"}
            </p>
          ) : (
            <select
              id="warehouse_id"
              name="warehouse_id"
              value={warehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((v, idx) => (
          <div
            key={v.id ?? `new-${idx}`}
            className="rounded-xl border border-paws-sand p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-paws-brown-dark">
                {isAr ? `متغير رقم ${idx + 1}` : `Variant ${idx + 1}`}
              </span>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(idx)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {isAr ? "حذف" : "Remove"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الحجم (مثلا 2kg)" : "Size (e.g. 2kg)"}</Label>
                <Input
                  value={v.size}
                  onChange={(e) => updateVariant(idx, { size: e.target.value })}
                  placeholder="2kg"
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الوزن بالكيلو (اختياري)" : "Weight in kg (optional)"}</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={v.weight}
                  onChange={(e) => updateVariant(idx, { weight: e.target.value })}
                  placeholder="2"
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "النكهة / اللون" : "Flavor / Color"}</Label>
                <Input
                  value={v.color}
                  onChange={(e) => updateVariant(idx, { color: e.target.value })}
                  placeholder={isAr ? "مثلا: دجاج" : "e.g. Chicken"}
                  className="bg-white border-paws-sand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{L.sellingPrice} ({L.egp}) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.price}
                  onChange={(e) => updateVariant(idx, { price: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border-paws-sand"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{L.costPrice} ({L.egp}) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.cost_price}
                  onChange={(e) => updateVariant(idx, { cost_price: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border-paws-sand"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الكمية" : "Quantity"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={v.quantity}
                  onChange={(e) => updateVariant(idx, { quantity: e.target.value })}
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الحد الأدنى" : "Low-stock"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={v.min_qty}
                  onChange={(e) => updateVariant(idx, { min_qty: e.target.value })}
                  className="bg-white border-paws-sand"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs text-muted-foreground">
                {isAr ? "باركود المتغير (اختياري)" : "Variant barcode (optional)"}
              </Label>
              <Input
                value={v.barcode}
                onChange={(e) => updateVariant(idx, { barcode: e.target.value })}
                className="bg-white border-paws-sand w-48 h-8 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="gap-1.5 border-paws-sand"
      >
        <Plus className="w-4 h-4" />
        {isAr ? "ضيف متغير" : "Add variant"}
      </Button>
    </div>
  );
}
