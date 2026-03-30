import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Scale,
  ArrowDownUp,
  Receipt,
  ShoppingCart,
  Package,
} from "lucide-react";
import Link from "next/link";

const REPORTS = [
  {
    icon: TrendingUp,
    title: "Profit & Loss",
    description: "Revenue, expenses, and net income for a given period",
    href: "/accounting/reports/profit-loss",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Scale,
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity at a point in time",
    href: "/accounting/reports/balance-sheet",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ArrowDownUp,
    title: "Cash Flow",
    description: "Cash inflows and outflows across operating, investing, and financing",
    href: "/accounting/reports/cash-flow",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Receipt,
    title: "VAT Report",
    description: "VAT collected and paid summary for tax filing",
    href: "/accounting/reports/vat",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: ShoppingCart,
    title: "Sales Report",
    description: "Sales breakdown by product, customer, and time period",
    href: "/accounting/reports/sales",
    color: "text-paws-orange",
    bg: "bg-orange-50",
  },
  {
    icon: Package,
    title: "Purchase Report",
    description: "Purchase orders and supplier spending analysis",
    href: "/accounting/reports/purchases",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Financial reports and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORTS.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="p-6 border-paws-sand hover:border-paws-orange hover:shadow-md transition-all cursor-pointer h-full">
              <div className={`w-12 h-12 ${report.bg} rounded-xl flex items-center justify-center mb-4`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <h3 className="font-bold text-paws-brown-dark mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="border-paws-sand hover:border-paws-orange hover:text-paws-orange"
              >
                View Report
              </Button>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/accounting"
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; Back to Accounting
        </Link>
      </div>
    </div>
  );
}
