import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { SecureImg } from "./ui";
import { uploadFile } from "../services/upload";

export interface PhotoUploadItem {
  url: string;
  caption: string;
}

export interface PhotoUploaderLabels {
  add: string;
  caption: string;
  remove: string;
  empty: string;
  uploading: string;
  uploadError: string;
  imageAlt: string;
}

interface PendingPhoto {
  id: number;
  file: File;
  previewUrl: string;
}

/** Unggah banyak foto, tampilkan thumbnail, dan simpan caption per foto. */
export function PhotoUploader({
  value,
  onChange,
  labels,
  disabled = false,
  onUploadError,
}: {
  value: readonly PhotoUploadItem[];
  onChange: (photos: PhotoUploadItem[]) => void;
  labels: PhotoUploaderLabels;
  disabled?: boolean;
  onUploadError?: (error: Error) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const valuesRef = useRef<readonly PhotoUploadItem[]>(value);
  const objectUrls = useRef(new Set<string>());
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    valuesRef.current = value;
  }, [value]);

  useEffect(() => () => {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
  }, []);

  const addFiles = async (files: FileList | null) => {
    const selected = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (selected.length === 0) return;

    const drafts = selected.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { id: nextId.current++, file, previewUrl };
    });
    setPending((current) => [...current, ...drafts]);
    setFailed(false);
    setUploading(true);

    try {
      for (const draft of drafts) {
        try {
          const url = await uploadFile(draft.file);
          const next = [...valuesRef.current, { url, caption: "" }];
          valuesRef.current = next;
          onChange(next);
        } catch (cause) {
          const error = cause instanceof Error ? cause : new Error(String(cause));
          setFailed(true);
          onUploadError?.(error);
        } finally {
          URL.revokeObjectURL(draft.previewUrl);
          objectUrls.current.delete(draft.previewUrl);
          setPending((current) => current.filter((photo) => photo.id !== draft.id));
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const updateCaption = (index: number, caption: string) => {
    const next = valuesRef.current.map((photo, photoIndex) => photoIndex === index ? { ...photo, caption } : photo);
    valuesRef.current = next;
    onChange(next);
  };

  const removePhoto = (index: number) => {
    const next = valuesRef.current.filter((_, photoIndex) => photoIndex !== index);
    valuesRef.current = next;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-label={labels.add}
        disabled={disabled || uploading}
        onChange={(event) => {
          void addFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        className="btn-secondary min-h-10"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" /> {labels.add}
      </button>

      {uploading && <p role="status" className="text-xs text-steel-500">{labels.uploading}</p>}
      {failed && <p role="alert" className="text-xs text-rose-700">{labels.uploadError}</p>}
      {value.length === 0 && pending.length === 0 && <p className="text-xs text-steel-500">{labels.empty}</p>}

      {(value.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map((photo, index) => (
            <div key={`${photo.url}-${index}`} className="flex min-w-0 gap-3 rounded-xl border border-steel-200 p-2">
              <SecureImg src={photo.url} alt={photo.caption || labels.imageAlt} name={labels.imageAlt} className="h-16 w-20 shrink-0 rounded-lg border border-steel-200 object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <label className="label" htmlFor={`photo-caption-${index}`}>{labels.caption.replace("{n}", String(index + 1))}</label>
                <input
                  id={`photo-caption-${index}`}
                  className="input w-full py-1.5 text-sm"
                  value={photo.caption}
                  disabled={disabled}
                  aria-label={labels.caption.replace("{n}", String(index + 1))}
                  onChange={(event) => updateCaption(index, event.target.value)}
                />
              </div>
              <button
                type="button"
                className="self-start rounded-lg p-2 text-steel-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
                aria-label={labels.remove.replace("{n}", String(index + 1))}
                disabled={disabled}
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {pending.map((photo) => (
            <div key={photo.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-steel-200 p-2 opacity-70">
              <img src={photo.previewUrl} alt={labels.imageAlt} className="h-16 w-20 shrink-0 rounded-lg border border-steel-200 object-cover" />
              <span className="min-w-0 truncate text-xs text-steel-500">{photo.file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
