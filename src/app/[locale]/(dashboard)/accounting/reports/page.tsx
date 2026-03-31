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
import { getLocale } from "next-intl/server";

export default async function ReportsPage() {
  const locale = await getLocale();

  const reports = [
    { icon: TrendingUp, title: "Profit & Loss", description: "Revenue, expenses, and net income for a given period", href: `/${locale}/accounting/reports/profit-loss`, color: "text-green-600", bg: "bg-green-50" },
    { icon: Scale, title: "Balance Sheet", description: "Assets, liabilities, and equity at a point in time", href: `/${locale}/accounting/reports/balance-sheet`, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: ArrowDownUp, title: "Cash Flow", description: "Cash inflows and outflows across operating, investing, and financing", href: `/${locale}/accounting/reports/cash-flow`, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Receipt, title: "VAT Report", description: "VAT collected and paid summary for tax filing", href: `/${locale}/accounting/reports/vat`, color: "text-red-600", bg: "bg-red-50" },
    { icon: ShoppingCart, title: "Sales Report", description: "Sales breakdown by product, customer, and time period", href: `/${locale}/accounting/reports/sales`, color: "text-paws-orange", bg: "bg-orange-50" },
    { icon: Package, title: "Purchase Report", description: "Purchase orders and supplier spending analysis", href: `/${locale}/accounting/reports/purchases`, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Financial reports and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="p-6 border-neutral-200 hover:border-paws-orange hover:shadow-md transition-all cursor-pointer h-full">
              <div className={`w-12 h-12 ${report.bg} rounded-xl flex items-center justify-center mb-4`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <h3 className="font-bold text-neutral-900 mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 hover:border-paws-orange hover:text-paws-orange"
              >
                View Report
              </Button>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href={`/${locale}/accounting`}
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; Back to Accounting
        </Link>
      </div>
    </div>
  );
}
