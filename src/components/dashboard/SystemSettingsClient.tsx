"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Loader2, Check, X } from "lucide-react";
import {
  initializeDefaultSettings,
  updateSetting,
} from "@/app/[locale]/(dashboard)/settings/system/actions";

export function InitializeDefaultsButton() {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const L = {
    failed: locale === "ar" ? "فشلت تهيئة الإعدادات." : "Failed to initialize settings.",
    ok: locale === "ar" ? "تم إنشاء الإعدادات الافتراضية." : "Default settings initialized.",
    loading: locale === "ar" ? "جاري التهيئة..." : "Initializing...",
    button: locale === "ar" ? "تهيئة الإعدادات الافتراضية" : "Initialize Default Settings",
  };

  function handleClick() {
    startTransition(async () => {
      const result = await initializeDefaultSettings();
      if (!result.ok) {
        toast.error(result.error ?? L.failed);
        return;
      }
      toast.success(L.ok);
      router.refresh();
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      {pending ? L.loading : L.button}
    </Button>
  );
}

interface EditableSettingProps {
  id: string;
  value: string;
}

export function EditableSetting({ id, value }: EditableSettingProps) {
  const router = useRouter();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const L = {
    failed: locale === "ar" ? "فشل تحديث الإعداد." : "Failed to update setting.",
    ok: locale === "ar" ? "تم تحديث الإعداد." : "Setting updated.",
  };

  function save() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await updateSetting(id, draft);
      if (!result.ok) {
        toast.error(result.error ?? L.failed);
        return;
      }
      toast.success(L.ok);
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-paws-brown bg-paws-cream/70 px-3 py-1 rounded-lg max-w-[200px] truncate">
          {value}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        autoFocus
        disabled={pending}
        className="h-8 w-[220px] text-sm bg-white border-paws-sand"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
        onClick={save}
        disabled={pending}
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground"
        onClick={cancel}
        disabled={pending}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
