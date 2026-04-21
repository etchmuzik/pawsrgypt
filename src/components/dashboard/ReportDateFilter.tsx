import Link from "next/link";
import { DATE_PRESETS } from "@/lib/report-dates";

interface ReportDateFilterProps {
  basePath: string;
  current: string;
}

export function ReportDateFilter({ basePath, current }: ReportDateFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {DATE_PRESETS.map((preset) => {
        const active = current === preset.value;
        const href = preset.value === "30d" ? basePath : `${basePath}?range=${preset.value}`;
        return (
          <Link
            key={preset.value}
            href={href}
            className={
              active
                ? "text-xs px-3 py-1.5 rounded-full bg-paws-orange text-white font-medium"
                : "text-xs px-3 py-1.5 rounded-full border border-paws-sand text-paws-brown hover:border-paws-orange hover:text-paws-orange transition-colors"
            }
          >
            {preset.label}
          </Link>
        );
      })}
    </div>
  );
}
