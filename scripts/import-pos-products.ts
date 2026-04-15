/**
 * One-time import of the physical store + warehouse catalog from the POS Excel export.
 *
 * Source file: scripts/pos-products-export.xlsx (341 rows from Paws Pet Shop POS)
 *
 * What this does:
 *   1. Wipes all existing products, variants, stock, and stock_movements
 *   2. Ensures a "Paws Pet Shop" warehouse exists (tied to the New Cairo branch)
 *   3. Inserts every row from the Excel as a product + variant + stock entry
 *   4. Maps species-based tagging (Dogs/Cats) to the website's category catalog
 *      (Food & Treats / Accessories / Grooming / Health & Wellness / Toys / Beds) via keyword detection
 *
 * How it was run (2026-04-15):
 *   Source file provided via WhatsApp → parsed with Python openpyxl → SQL emitted in 13 chunks →
 *   applied via Supabase MCP execute_sql (see imported_snapshot for counts).
 *
 * Expected result:
 *   341 products, 341 variants, 341 stock rows, 5,057 total units, 530,455 EGP retail value,
 *   119,144 EGP cost value.
 *
 * To re-run against a fresh database, use: npx tsx scripts/import-pos-products.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCE_XLSX = path.join(__dirname, "pos-products-export.xlsx");

interface SheetRow {
  الكود: number;
  الباركود: string | number | null;
  "اسم الصنف": string;
  الشركة: string | null;
  الوحدة: string | null;       // Dogs | Cats | Cats & Dogs
  "سعر البيع": number;
  "النوع": string | null;       // description
  الكمية: number;
  "سعر الشراء": number;
}

interface CategoryMap {
  food: string;
  accessories: string;
  grooming: string;
  toys: string;
  health: string;
  beds: string;
}

function categorize(name: string, brand: string | null): keyof CategoryMap {
  const n = (name || "").toLowerCase();
  const b = (brand || "").toLowerCase();
  if (b === "accessories") return "accessories";
  if (/bed|house|tree|kennel|crate|carrier|برج|مسنطيل|فراش/i.test(n)) return "beds";
  if (/toy|ball|rope|ريشه|كوره|كورة|عضاضه|لعبه|فأر/i.test(n)) return "toys";
  if (/shampoo|brush|grooming|comb|nail|clipper|scissor|deshedd|فرشة|شامبو|مقص|قصافة/i.test(n)) return "grooming";
  if (/bravecto|frontline|advocate|drontal|revolution|seresto|vaccine|wormer|dewormer|flea|tick|medicine|supplement|vitamin|probiotic|hepatic|renal|urinary|diabetes|gastro|derma|hypoaller|شراب|دواء|مرهم|فيتامين/i.test(n)) return "health";
  if (/litter|رمل|cat sand/i.test(n)) return "accessories";
  return "food";
}

async function getCategoryMap(): Promise<CategoryMap> {
  const { data, error } = await supabase.from("categories").select("id, name_en");
  if (error) throw error;
  const byName = new Map<string, string>();
  for (const c of data ?? []) byName.set(c.name_en, c.id);
  return {
    food: byName.get("Food & Treats")!,
    accessories: byName.get("Accessories")!,
    grooming: byName.get("Grooming")!,
    toys: byName.get("Toys")!,
    health: byName.get("Health & Wellness")!,
    beds: byName.get("Beds & Furniture")!,
  };
}

async function ensureWarehouse(): Promise<string> {
  const { data: existing } = await supabase
    .from("warehouses")
    .select("id")
    .eq("name", "Paws Pet Shop")
    .single();
  if (existing) return existing.id;

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("name", "New Cairo Branch")
    .single();
  if (!branch) throw new Error("New Cairo Branch not found");

  const { data: created, error } = await supabase
    .from("warehouses")
    .insert({ name: "Paws Pet Shop", branch_id: branch.id, is_active: true })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function wipe(): Promise<void> {
  console.log("Wiping existing products/variants/stock...");
  await supabase.from("stock").delete().gte("quantity", -1);
  await supabase.from("stock_movements").delete().gte("quantity", -1);
  await supabase.from("product_variants").delete().gte("price", -1);
  await supabase.from("products").delete().eq("is_active", true);
  await supabase.from("products").delete().eq("is_active", false);
}

async function main() {
  if (!fs.existsSync(SOURCE_XLSX)) {
    console.error(`Source file not found: ${SOURCE_XLSX}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(SOURCE_XLSX);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<SheetRow>(ws);

  console.log(`Parsed ${rows.length} rows from ${path.basename(SOURCE_XLSX)}`);

  await wipe();
  const warehouseId = await ensureWarehouse();
  const categories = await getCategoryMap();

  const seenSkus = new Set<string>();
  let inserted = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r["اسم الصنف"] || "").trim();
    if (!name) continue;

    const brand = r.الشركة?.trim() ?? null;
    const species = r.الوحدة?.trim() ?? null;

    let sku = `PS-${String(r.الكود).padStart(4, "0")}`;
    let n = 1;
    while (seenSkus.has(sku)) {
      n += 1;
      sku = `PS-${String(r.الكود).padStart(4, "0")}-${n}`;
    }
    seenSkus.add(sku);

    const categoryKey = categorize(name, brand);
    const tags: string[] = [];
    if (species) {
      for (const s of species.replace(/&/g, ",").split(",")) {
        const t = s.trim().toLowerCase();
        if (t === "dogs") tags.push("dog");
        if (t === "cats") tags.push("cat");
      }
    }
    if (brand) tags.push(brand.toLowerCase());

    const description = r["النوع"]?.trim() ?? null;

    const { data: product, error: pErr } = await supabase
      .from("products")
      .insert({
        sku,
        name_en: name,
        name_ar: name,
        description_en: description,
        description_ar: description,
        category_id: categories[categoryKey],
        brand,
        barcode: r.الباركود != null ? String(r.الباركود) : null,
        tags,
        is_active: true,
      })
      .select("id")
      .single();
    if (pErr || !product) {
      console.error(`Failed product ${sku}:`, pErr);
      continue;
    }

    await supabase.from("product_variants").insert({
      product_id: product.id,
      price: r["سعر البيع"] ?? 0,
      cost_price: r["سعر الشراء"] ?? 0,
      barcode: r.الباركود != null ? String(r.الباركود) : null,
    });

    await supabase.from("stock").insert({
      product_id: product.id,
      warehouse_id: warehouseId,
      quantity: r.الكمية ?? 0,
    });

    inserted += 1;
  }

  console.log(`Imported ${inserted} products, variants, and stock rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
