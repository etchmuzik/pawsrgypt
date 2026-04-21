"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, FileSpreadsheet, Loader2, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FIELD_LABELS,
  autoMapColumns,
  commitBatch,
  errorsToCsv,
  mapRow,
  validateRows,
  type CategoryLookup,
  type FieldKey,
  type MappedRow,
  type ValidationError,
} from "@/lib/product-import";

type Step = "upload" | "map" | "review" | "commit" | "done";

interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export default function ImportProductsPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({});
  const [categories, setCategories] = useState<CategoryLookup[]>([]);
  const [validRows, setValidRows] = useState<MappedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed: { sku: string; message: string }[] } | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name_en, name_ar");
      if (data) setCategories(data as CategoryLookup[]);
    }
    loadCategories();
  }, [supabase]);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error("No sheet found in file.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      if (rows.length === 0) {
        toast.error("Sheet is empty.");
        return;
      }
      const headers = Object.keys(rows[0]);
      setSheet({ headers, rows });
      setMapping(autoMapColumns(headers));
      setStep("map");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Parse failed";
      toast.error(`Could not parse file: ${msg}`);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  function proceedToReview() {
    if (!sheet) return;
    const mapped = sheet.rows.map((r) => mapRow(r, mapping));
    const { valid, errors } = validateRows(mapped);
    setValidRows(valid);
    setValidationErrors(errors);
    setStep("review");
  }

  async function runImport() {
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    setCommitting(true);
    setStep("commit");
    setProgress({ done: 0, total: validRows.length });
    const res = await commitBatch(supabase, validRows, categories, (done, total) =>
      setProgress({ done, total }),
    );
    setResult(res);
    setCommitting(false);
    setStep("done");
  }

  function downloadErrors() {
    if (validationErrors.length === 0) return;
    const csv = errorsToCsv(validationErrors);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/products`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-paws-brown">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">Bulk Import Products</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs font-medium">
        {(["upload", "map", "review", "done"] as Step[]).map((s, i) => {
          const order: Step[] = ["upload", "map", "review", "commit", "done"];
          const currentIdx = order.indexOf(step);
          const isDone = order.indexOf(s) < currentIdx;
          const isCurrent = s === step || (s === "review" && step === "commit");
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  isDone && "bg-paws-orange text-white",
                  isCurrent && "bg-paws-orange/20 text-paws-orange",
                  !isDone && !isCurrent && "bg-paws-cream text-paws-brown/40",
                )}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(isCurrent ? "text-paws-brown-dark" : "text-paws-brown/60")}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 3 && <span className="text-paws-brown/30">—</span>}
            </div>
          );
        })}
      </div>

      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="bg-white rounded-2xl border-2 border-dashed border-paws-sand p-16 text-center space-y-4"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-paws-cream flex items-center justify-center">
            {parsing ? (
              <Loader2 className="w-7 h-7 text-paws-orange animate-spin" />
            ) : (
              <FileSpreadsheet className="w-7 h-7 text-paws-orange" />
            )}
          </div>
          <div>
            <p className="font-semibold text-paws-brown-dark">
              Drop an Excel or CSV file
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              .xlsx, .xls, or .csv — up to 10MB
            </p>
          </div>
          <label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="inline-flex items-center gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium">
              <Upload className="w-4 h-4" /> Choose file
            </span>
          </label>
        </div>
      )}

      {step === "map" && sheet && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-paws-sand p-6">
            <h2 className="font-semibold text-paws-brown-dark text-lg mb-1">
              Map columns
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Found {sheet.rows.length} row(s). Match each column from your file to a product field.
            </p>
            <div className="space-y-2">
              {sheet.headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="flex-1 font-mono text-xs text-paws-brown bg-paws-cream/40 px-3 py-2 rounded-lg truncate">
                    {header}
                  </span>
                  <span className="text-paws-brown/40">→</span>
                  <select
                    value={mapping[header] ?? "ignore"}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [header]: e.target.value as FieldKey }))
                    }
                    className="flex-1 h-9 rounded-lg border border-paws-sand bg-white px-3 text-sm"
                  >
                    {Object.entries(FIELD_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-paws-sand p-6">
            <h3 className="font-semibold text-paws-brown-dark mb-3">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-paws-sand">
                    {sheet.headers.map((h) => (
                      <th key={h} className="text-start px-2 py-1.5 text-paws-brown/80 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-paws-sand/30">
                      {sheet.headers.map((h) => (
                        <td key={h} className="px-2 py-1.5 text-paws-brown/70 truncate max-w-[180px]">
                          {r[h] === null || r[h] === undefined ? "—" : String(r[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("upload")} className="border-paws-sand">
              <X className="w-4 h-4" /> Choose different file
            </Button>
            <Button onClick={proceedToReview} className="bg-paws-orange hover:bg-paws-orange/90 text-white">
              Continue to review
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-paws-sand p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-paws-brown-dark">Ready to import</h3>
              </div>
              <p className="text-3xl font-bold text-paws-brown-dark">{validRows.length}</p>
              <p className="text-sm text-muted-foreground">rows will be added</p>
            </div>
            <div className="bg-white rounded-2xl border border-paws-sand p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-paws-brown-dark">Issues</h3>
              </div>
              <p className="text-3xl font-bold text-paws-brown-dark">{validationErrors.length}</p>
              <p className="text-sm text-muted-foreground">rows skipped</p>
              {validationErrors.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadErrors}
                  className="mt-3 border-paws-sand"
                >
                  Download errors CSV
                </Button>
              )}
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-white rounded-2xl border border-paws-sand p-6">
              <h3 className="font-semibold text-paws-brown-dark mb-3">First 10 issues</h3>
              <ul className="space-y-1.5 text-sm">
                {validationErrors.slice(0, 10).map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-paws-brown/50">row {err.rowIndex + 1}</span>
                    <span className="text-paws-brown-dark">{err.field}:</span>
                    <span className="text-muted-foreground">{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("map")} className="border-paws-sand">
              Back
            </Button>
            <Button
              onClick={runImport}
              disabled={validRows.length === 0}
              className="bg-paws-orange hover:bg-paws-orange/90 text-white"
            >
              Import {validRows.length} product{validRows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {step === "commit" && (
        <div className="bg-white rounded-2xl border border-paws-sand p-10 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-paws-orange animate-spin mx-auto" />
          <p className="font-semibold text-paws-brown-dark">Importing products…</p>
          <p className="text-sm text-muted-foreground">
            {progress.done} / {progress.total} committed
          </p>
          <div className="max-w-md mx-auto h-2 rounded-full bg-paws-cream overflow-hidden">
            <div
              className="h-full bg-paws-orange transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="bg-white rounded-2xl border border-paws-sand p-10 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <div>
            <p className="text-xl font-bold text-paws-brown-dark">Import complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.inserted} product{result.inserted === 1 ? "" : "s"} added
              {result.failed.length > 0 && `, ${result.failed.length} failed`}
            </p>
          </div>
          {result.failed.length > 0 && (
            <div className="text-start text-sm bg-red-50 border border-red-100 rounded-xl p-4 max-h-48 overflow-y-auto max-w-xl mx-auto">
              <p className="font-semibold text-red-700 mb-2">Failures:</p>
              <ul className="space-y-1 text-red-600">
                {result.failed.slice(0, 20).map((f, i) => (
                  <li key={i}>
                    <span className="font-mono">{f.sku}</span> — {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSheet(null);
                setMapping({});
                setValidRows([]);
                setValidationErrors([]);
                setResult(null);
                setStep("upload");
              }}
              className="border-paws-sand"
            >
              Import another file
            </Button>
            <Button
              onClick={() => router.push(`/${locale}/products`)}
              className="bg-paws-orange hover:bg-paws-orange/90 text-white"
            >
              Back to products
            </Button>
          </div>
        </div>
      )}

      {committing && null /* keep committing state referenced */}
    </div>
  );
}
