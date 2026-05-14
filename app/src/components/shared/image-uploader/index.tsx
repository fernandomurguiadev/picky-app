"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";
import { toast } from "@/components/shared/toast";
import { apiBff } from "@/lib/api/axios";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export function ImageUploader({
  value,
  onChange,
  onRemove,
  className,
  maxSizeMB = MAX_SIZE_MB,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Tipo de archivo no soportado", "Solo JPG, PNG o WebP");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`El archivo supera ${maxSizeMB}MB`);
        return;
      }

      // Preview inmediato
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setIsUploading(true);
      setProgress(0);

      try {
        // Comprimir client-side antes de subir
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: setProgress,
        });

        const formData = new FormData();
        formData.append("file", compressed, file.name);

        const res = await apiBff.post<{ data: { url: string } }>("/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        onChange(res.data.data.url);
        toast.success("Imagen subida correctamente");
      } catch (error) {
        console.error("Error al subir imagen:", error);
        toast.error("No se pudo subir la imagen");
        setPreview(value ?? null);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [maxSizeMB, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onRemove?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        !disabled && "cursor-pointer hover:border-primary/60",
        disabled && "opacity-50 cursor-not-allowed",
        "min-h-36 p-4",
        className
      )}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={!disabled ? handleDrop : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Subir imagen"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-48 max-w-full rounded object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
              aria-label="Eliminar imagen"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {isUploading ? (
              <Upload className="h-5 w-5 animate-bounce" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </div>
          <div className="text-sm text-center">
            {isUploading ? (
              <span>Subiendo... {progress}%</span>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  Arrastrá o hacé clic
                </span>{" "}
                para subir
              </>
            )}
          </div>
          <p className="text-xs">JPG, PNG o WebP · máx. {maxSizeMB}MB</p>
        </div>
      )}

      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
