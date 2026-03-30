import { Card } from "@/components/ui/card";
import { Users, Building2, Shield, Bell } from "lucide-react";
import Link from "next/link";

const SETTINGS_MODULES = [
  { icon: Users, title: "Users", desc: "Manage team members and access", href: "/settings/users", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Shield, title: "Roles & Permissions", desc: "Configure role-based access control", href: "/settings/roles", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Building2, title: "Branches", desc: "Manage store locations", href: "/settings/branches", color: "text-green-600", bg: "bg-green-50" },
  { icon: Bell, title: "Notifications", desc: "SMS and email notification settings", href: "/settings/notifications", color: "text-paws-orange", bg: "bg-orange-50" },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-paws-brown-dark mb-6">Settings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SETTINGS_MODULES.map((mod) => (
          <Link key={mod.title} href={mod.href}>
            <Card className="p-6 border-paws-sand hover:border-paws-orange hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${mod.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-paws-brown-dark">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
