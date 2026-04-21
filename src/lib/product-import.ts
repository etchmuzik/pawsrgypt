import type { SupabaseClient } from "@supabase/supabase-js";

export type FieldKey =
  | "sku"
  | "barcode"
  | "name_en"
  | "name_ar"
  | "description_en"
  | "description_ar"
  | "brand"
  | "category"
  | "unit_type"
  | "price"
  | "cost_price"
  | "image_url"
  | "tags"
  | "ignore";

export const FIELD_LABELS: Record<FieldKey, string> = {
  sku: "SKU",
  barcode: "Barcode",
  name_en: "Name (English)",
  name_ar: "Name (Arabic)",
  description_en: "Description (English)",
  description_ar: "Description (Arabic)",
  brand: "Brand",
  category: "Category",
  unit_type: "Unit Type",
  price: "Selling Price",
  cost_price: "Cost Price",
  image_url: "Image URL",
  tags: "Tags (comma-separated)",
  ignore: "— Ignore —",
};

// Heuristic: map spreadsheet column headers to our internal fields.
// Supports English and Arabic headers commonly found in POS exports.
const HEADER_HINTS: Array<{ field: FieldKey; patterns: RegExp[] }> = [
  { field: "sku", patterns: [/^sku$/i, /^code$/i, /كود/, /الكود/] },
  { field: "barcode", patterns: [/barcode/i, /باركود/] },
  { field: "name_en", patterns: [/^name(_en|_english)?$/i, /^name$/i, /item.*name/i, /اسم.*صنف/] },
  { field: "name_ar", patterns: [/name_ar/i, /arabic/i] },
  { field: "description_en", patterns: [/^description(_en)?$/i, /^desc$/i] },
  { field: "description_ar", patterns: [/description_ar/i, /وصف/, /ملاحظات/] },
  { field: "brand", patterns: [/brand/i, /manufacturer/i, /company/i, /الشركة/, /ماركة/] },
  { field: "category", patterns: [/category/i, /type/i, /النوع/, /فئة/, /تصنيف/] },
  { field: "unit_type", patterns: [/^unit$/i, /unit_type/i, /الوحدة/] },
  { field: "price", patterns: [/^price$/i, /sell.*price/i, /selling/i, /retail/i, /سعر.*بيع/] },
  { field: "cost_price", patterns: [/cost/i, /wholesale/i, /سعر.*شراء/, /سعر.*جملة/] },
  { field: "image_url", patterns: [/image/i, /photo/i, /picture/i, /صورة/] },
  { field: "tags", patterns: [/tags?/i, /keywords?/i] },
];

export function autoMapColumns(headers: string[]): Record<string, FieldKey> {
  const mapping: Record<string, FieldKey> = {};
  const used = new Set<FieldKey>();
  for (const header of headers) {
    const normalized = String(header).trim();
    let matched: FieldKey = "ignore";
    for (const { field, patterns } of HEADER_HINTS) {
      if (used.has(field)) continue;
      if (patterns.some((re) => re.test(normalized))) {
        matched = field;
        used.add(field);
        break;
      }
    }
    mapping[header] = matched;
  }
  return mapping;
}

type Row = Record<string, unknown>;

export interface MappedRow {
  sku: string;
  barcode: string | null;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  brand: string | null;
  category: string | null;
  unit_type: string;
  price: number;
  cost_price: number;
  image_url: string | null;
  tags: string[];
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: MappedRow[];
  errors: ValidationError[];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? null : n;
}

function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function mapRow(row: Row, mapping: Record<string, FieldKey>): MappedRow {
  const collected: Partial<Record<FieldKey, unknown>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (field === "ignore") continue;
    if (row[header] !== undefined && row[header] !== null && row[header] !== "") {
      collected[field] = row[header];
    }
  }

  const name_en = toTrimmedString(collected.name_en);
  const name_ar = toTrimmedString(collected.name_ar);
  const tagsRaw = toTrimmedString(collected.tags);
  const tags = tagsRaw
    ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    sku: toTrimmedString(collected.sku),
    barcode: toTrimmedString(collected.barcode) || null,
    name_en: name_en || name_ar,
    name_ar: name_ar || name_en,
    description_en: toTrimmedString(collected.description_en) || null,
    description_ar: toTrimmedString(collected.description_ar) || null,
    brand: toTrimmedString(collected.brand) || null,
    category: toTrimmedString(collected.category) || null,
    unit_type: toTrimmedString(collected.unit_type) || "piece",
    price: toNumber(collected.price) ?? 0,
    cost_price: toNumber(collected.cost_price) ?? 0,
    image_url: toTrimmedString(collected.image_url) || null,
    tags,
  };
}

export function validateRows(rows: MappedRow[]): ValidationResult {
  const valid: MappedRow[] = [];
  const errors: ValidationError[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    if (!row.sku) {
      errors.push({ rowIndex: index, field: "sku", message: "Missing SKU" });
      return;
    }
    if (!row.name_en && !row.name_ar) {
      errors.push({ rowIndex: index, field: "name_en", message: "Missing name" });
      return;
    }
    if (row.price <= 0) {
      errors.push({
        rowIndex: index,
        field: "price",
        message: "Missing or invalid price",
      });
      return;
    }
    if (seenSkus.has(row.sku)) {
      errors.push({
        rowIndex: index,
        field: "sku",
        message: `Duplicate SKU in file: ${row.sku}`,
      });
      return;
    }
    seenSkus.add(row.sku);
    valid.push(row);
  });

  return { valid, errors };
}

export interface CategoryLookup {
  id: string;
  name_en: string;
  name_ar: string;
}

export function resolveCategory(
  row: MappedRow,
  categories: CategoryLookup[],
): string | null {
  if (!row.category) return null;
  const needle = row.category.toLowerCase().trim();
  const match = categories.find(
    (c) =>
      c.name_en.toLowerCase() === needle ||
      c.name_ar.toLowerCase() === needle ||
      c.name_en.toLowerCase().includes(needle) ||
      needle.includes(c.name_en.toLowerCase()),
  );
  return match?.id ?? null;
}

export interface CommitResult {
  inserted: number;
  failed: Array<{ sku: string; message: string }>;
}

export async function commitBatch(
  supabase: SupabaseClient,
  rows: MappedRow[],
  categories: CategoryLookup[],
  onProgress: (done: number, total: number) => void,
): Promise<CommitResult> {
  const result: CommitResult = { inserted: 0, failed: [] };
  const BATCH = 25;

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);

    // Insert products one at a time within batch so a single failure doesn't
    // poison the whole slice. Small DB; this trades a little speed for clarity.
    for (const row of slice) {
      const categoryId = resolveCategory(row, categories);

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          sku: row.sku,
          name_en: row.name_en,
          name_ar: row.name_ar,
          description_en: row.description_en,
          description_ar: row.description_ar,
          category_id: categoryId,
          brand: row.brand,
          unit_type: row.unit_type,
          barcode: row.barcode,
          images: row.image_url ? [row.image_url] : [],
          tags: row.tags,
          is_active: true,
          is_featured: false,
        } as never)
        .select("id")
        .single();

      if (productError || !product) {
        result.failed.push({
          sku: row.sku,
          message: productError?.message ?? "Insert returned no row",
        });
        continue;
      }

      const productId = (product as { id: string }).id;

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          size: null,
          color: null,
          weight: null,
          price: row.price,
          cost_price: row.cost_price,
          barcode: row.barcode,
          is_active: true,
        } as never);

      if (variantError) {
        result.failed.push({
          sku: row.sku,
          message: `Variant failed: ${variantError.message}`,
        });
        continue;
      }

      result.inserted += 1;
    }

    onProgress(Math.min(i + BATCH, rows.length), rows.length);
  }

  return result;
}

export function errorsToCsv(errors: ValidationError[]): string {
  const lines = ["row,field,message"];
  for (const err of errors) {
    const msg = err.message.replace(/"/g, '""');
    lines.push(`${err.rowIndex + 1},${err.field},"${msg}"`);
  }
  return lines.join("\n");
}
