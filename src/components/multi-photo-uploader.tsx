// This component remains self-contained and does not depend on your current form.
"use client"

import { useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function MultiPhotoUploader({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onFilesSelected = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      // Merge new files (avoid duplicates by name + lastModified + size)
      const existingKeys = new Set(files.map((f) => `${f.name}-${f.lastModified}-${f.size}`))
      const next: File[] = [...files]
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList.item(i)
        if (!f) continue
        const key = `${f.name}-${f.lastModified}-${f.size}`
        if (!existingKeys.has(key)) next.push(f)
      }
      onChange(next)
    },
    [files, onChange],
  )

  const removeAt = (idx: number) => {
    const next = files.slice()
    next.splice(idx, 1)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} aria-label="Add photos">
          Add Photos
        </Button>
        <Label className="text-sm text-muted-foreground">You can select multiple images at once.</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {files.map((f, idx) => {
            const url = URL.createObjectURL(f)
            return (
              <figure key={`${f.name}-${f.lastModified}`} className="group relative overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url || "/placeholder.svg"} alt={f.name} className="h-28 w-full object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-background/70 backdrop-blur text-xs px-2 py-1 truncate">
                  {f.name}
                </figcaption>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute right-2 top-2 rounded bg-background/80 px-2 py-1 text-xs border hover:bg-background"
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </figure>
            )
          })}
        </div>
      ) : (
        <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
          No photos yet. Click “Add Photos” to select images.
        </div>
      )}
    </div>
  )
}
