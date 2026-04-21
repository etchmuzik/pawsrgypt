"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await initializeDefaultSettings();
      if (!result.ok) {
        toast.error(result.error ?? "Failed to initialize settings.");
        return;
      }
      toast.success("Default settings initialized.");
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
      {pending ? "Initializing..." : "Initialize Default Settings"}
    </Button>
  );
}

interface EditableSettingProps {
  id: string;
  value: string;
}

export function EditableSetting({ id, value }: EditableSettingProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  function save() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await updateSetting(id, draft);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to update setting.");
        return;
      }
      toast.success("Setting updated.");
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
