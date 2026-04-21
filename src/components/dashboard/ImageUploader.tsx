"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB pre-compression (phone photos)
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic,.heif";

interface ImageUploaderProps {
  bucket: string;
  folder: string;
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

function extractStoragePath(publicUrl: string, bucket: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) {
    return "";
  }
  return publicUrl.slice(index + marker.length);
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const converted = Array.isArray(blob) ? blob[0] : blob;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "");
  return new File([converted], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([compressed], `${baseName}.webp`, { type: "image/webp" });
}

export function ImageUploader({
  bucket,
  folder,
  images,
  onChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = images.length + uploading.length < maxImages;

  const validateFile = useCallback((file: File): boolean => {
    const validType =
      ACCEPTED_TYPES.includes(file.type.toLowerCase()) || isHeic(file);
    if (!validType) {
      toast.error(`"${file.name}" is not supported. Use JPG, PNG, WebP, or HEIC.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" exceeds 10MB limit.`);
      return false;
    }
    return true;
  }, []);

  const uploadFile = useCallback(
    async (originalFile: File): Promise<string | null> => {
      const uploadId = crypto.randomUUID();
      setUploading((prev) => [
        ...prev,
        { id: uploadId, name: originalFile.name, progress: 0 },
      ]);

      try {
        let file = originalFile;

        if (isHeic(file)) {
          try {
            file = await convertHeicToJpeg(file);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "conversion failed";
            toast.error(`Could not convert "${originalFile.name}" from HEIC: ${msg}`);
            setUploading((prev) => prev.filter((u) => u.id !== uploadId));
            return null;
          }
        }

        try {
          file = await compressImage(file);
        } catch {
          // fall back to original file if compression fails
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          toast.error("You must be signed in to upload images.");
          setUploading((prev) => prev.filter((u) => u.id !== uploadId));
          return null;
        }

        const ext = file.name.split(".").pop() ?? "webp";
        const uniqueName = `${crypto.randomUUID()}.${ext}`;
        const path = `${folder}/${uniqueName}`;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
          toast.error("Supabase URL not configured.");
          setUploading((prev) => prev.filter((u) => u.id !== uploadId));
          return null;
        }
        const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

        const publicUrl = await new Promise<string | null>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", endpoint);
          xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
          xhr.setRequestHeader("x-upsert", "false");
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.setRequestHeader("Cache-Control", "3600");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === uploadId ? { ...u, progress: Math.min(progress, 99) } : u,
                ),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const { data } = supabase.storage.from(bucket).getPublicUrl(path);
              setUploading((prev) =>
                prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u)),
              );
              resolve(data.publicUrl);
            } else {
              let message = `Upload failed (${xhr.status})`;
              try {
                const parsed = JSON.parse(xhr.responseText);
                if (parsed?.message) message = parsed.message;
              } catch {
                // ignore parse errors
              }
              toast.error(`Failed to upload "${originalFile.name}": ${message}`);
              resolve(null);
            }
          };

          xhr.onerror = () => {
            toast.error(`Network error uploading "${originalFile.name}".`);
            resolve(null);
          };

          xhr.send(file);
        });

        await new Promise((resolve) => setTimeout(resolve, 250));
        setUploading((prev) => prev.filter((u) => u.id !== uploadId));
        return publicUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        toast.error(`Failed to process "${originalFile.name}": ${msg}`);
        setUploading((prev) => prev.filter((u) => u.id !== uploadId));
        return null;
      }
    },
    [bucket, folder],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const slotsAvailable = maxImages - images.length - uploading.length;

      if (slotsAvailable <= 0) {
        toast.error(`Maximum ${maxImages} images allowed.`);
        return;
      }

      const validFiles = files.filter(validateFile).slice(0, slotsAvailable);

      if (files.length > slotsAvailable) {
        toast.warning(`Only ${slotsAvailable} more image(s) can be added.`);
      }

      const results = await Promise.all(validFiles.map(uploadFile));
      const newUrls = results.filter((url): url is string => url !== null);

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }
    },
    [images, maxImages, uploading.length, validateFile, uploadFile, onChange],
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const url = images[index];
      const path = extractStoragePath(url, bucket);

      if (path) {
        const supabase = createClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
          toast.error(`Failed to remove image: ${error.message}`);
          return;
        }
      }

      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    },
    [images, bucket, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Clipboard paste — listen globally while component mounted
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const pastedFiles = items
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (pastedFiles.length > 0) {
        e.preventDefault();
        handleFiles(pastedFiles);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  // Reorder drag handlers
  const handleReorderDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleReorderDragOver = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === targetIndex) return;
      const reordered = [...images];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      onChange(reordered);
      setDragIndex(targetIndex);
    },
    [dragIndex, images, onChange],
  );

  const handleReorderDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canUploadMore && (
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer",
            isDragOver
              ? "border-paws-orange bg-paws-orange/5"
              : "border-paws-sand bg-white hover:border-paws-orange/50",
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              isDragOver ? "bg-paws-orange/10" : "bg-paws-sand/30",
            )}
          >
            {isDragOver ? (
              <Upload className="h-6 w-6 text-paws-orange" />
            ) : (
              <ImagePlus className="h-6 w-6 text-paws-orange" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragOver ? "Drop images here" : "Drag, drop, paste, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG, WebP, HEIC — auto-compressed — {images.length}/{maxImages} uploaded
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Upload progress indicators */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-paws-sand bg-white p-3"
            >
              <Loader2 className="h-5 w-5 animate-spin text-paws-orange" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-gray-700">{file.name}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paws-sand/50">
                  <div
                    className="h-full rounded-full bg-paws-orange transition-all duration-200"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400">{file.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleReorderDragStart(index)}
              onDragOver={(e) => handleReorderDragOver(e, index)}
              onDragEnd={handleReorderDragEnd}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl border-2 bg-white transition-all cursor-grab active:cursor-grabbing",
                dragIndex === index
                  ? "border-paws-orange opacity-50 scale-95"
                  : "border-paws-sand hover:border-paws-orange/50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
