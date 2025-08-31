"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type ComposedImage = {
  horizontalBlob?: Blob
  verticalBlob?: Blob
  shareUrlHorizontal?: string
  shareUrlVertical?: string
}

export function ThumbnailGallery({
  userPhotoDataUrl,
  backgrounds,
  onComposedChange,
  placement,
}: {
  userPhotoDataUrl: string | null
  backgrounds: string[]
  onComposedChange: (items: ComposedImage[]) => void
  placement: "left" | "center" | "right"
}) {
  const [items, setItems] = useState<ComposedImage[]>([])
  useEffect(() => {
    onComposedChange(items)
  }, [items, onComposedChange])

  // Split incoming backgrounds assuming they alternate horizontal/vertical
  const pairs = useMemo(() => {
    const res: { h?: string; v?: string }[] = []
    for (let i = 0; i < backgrounds.length; i += 2) {
      res.push({ h: backgrounds[i], v: backgrounds[i + 1] })
    }
    return res
  }, [backgrounds])

  useEffect(() => {
    setItems([])
  }, [backgrounds])

  if (!userPhotoDataUrl) {
    return null
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Results</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {pairs.map((p, idx) => (
          <Card key={idx} className="p-3 space-y-3">
            <div className="grid gap-3">
              <CanvasComposer
                mode="horizontal"
                background={p.h}
                userPhoto={userPhotoDataUrl}
                placement={placement}
                onBlob={(blob) => {
                  setItems((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx], horizontalBlob: blob }
                    return next
                  })
                }}
              />
              <CanvasComposer
                mode="vertical"
                background={p.v}
                userPhoto={userPhotoDataUrl}
                placement={placement}
                onBlob={(blob) => {
                  setItems((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx], verticalBlob: blob }
                    return next
                  })
                }}
              />
            </div>

            <RowActions
              item={items[idx]}
              index={idx}
              onShareUpdate={(u) => {
                setItems((prev) => {
                  const next = [...prev]
                  next[idx] = { ...next[idx], ...u }
                  return next
                })
              }}
            />
          </Card>
        ))}
      </div>
    </section>
  )
}

function CanvasComposer({
  mode,
  background,
  userPhoto,
  placement,
  onBlob,
}: {
  mode: "horizontal" | "vertical"
  background?: string
  userPhoto: string
  placement: "left" | "center" | "right"
  onBlob: (blob: Blob) => void
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!background) return
    ;(async () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const width = mode === "horizontal" ? 1280 : 1080
      const height = mode === "horizontal" ? 720 : 1920
      canvas.width = width
      canvas.height = height

      const bg = await loadImage(background)
      ctx.drawImage(bg, 0, 0, width, height)

      const face = await loadImage(userPhoto)
      const scaleFactor = mode === "horizontal" ? 0.6 : 0.5
      const desiredHeight = height * scaleFactor
      const ratio = face.width / face.height
      const drawHeight = desiredHeight
      const drawWidth = desiredHeight * ratio

      let x = width - drawWidth - 32
      if (placement === "left") x = 32
      if (placement === "center") x = width / 2 - drawWidth / 2

      const y = height - drawHeight - 24

      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.35)"
      ctx.shadowBlur = 24
      ctx.drawImage(face, x, y, drawWidth, drawHeight)
      ctx.restore()

      canvas.toBlob((blob) => {
        if (!blob) return
        const u = URL.createObjectURL(blob)
        setUrl(u)
        onBlob(blob)
      }, "image/png")
    })()
  }, [background, userPhoto, mode, placement])

  return (
    <figure className="space-y-2">
      {url ? (
        <img
          src={url || "/placeholder.svg"}
          alt={`${mode} composed thumbnail`}
          className="w-full rounded border bg-muted object-cover"
        />
      ) : (
        <div className="h-48 w-full animate-pulse rounded bg-muted" />
      )}
      <figcaption className="text-xs text-muted-foreground capitalize">{mode}</figcaption>
    </figure>
  )
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function RowActions({
  item,
  index,
  onShareUpdate,
}: {
  item?: ComposedImage
  index: number
  onShareUpdate: (u: Partial<ComposedImage>) => void
}) {
  async function downloadSingle(blob?: Blob, name?: string) {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name ?? "thumbnail.png"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard(blob?: Blob) {
    if (!blob || !("ClipboardItem" in window)) return
    // @ts-ignore
    const item = new ClipboardItem({ "image/png": blob })
    await navigator.clipboard.write([item])
  }

  async function share(blob?: Blob, orientation?: "horizontal" | "vertical") {
    if (!blob) return
    const buf = await blob.arrayBuffer()
    const base64 = arrayBufferToBase64(buf)
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `thumbnail-${orientation}-${index + 1}.png`,
        base64,
      }),
    })
    if (res.ok) {
      const { url } = await res.json()
      if (orientation === "horizontal") onShareUpdate({ shareUrlHorizontal: url })
      if (orientation === "vertical") onShareUpdate({ shareUrlVertical: url })
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Button variant="secondary" onClick={() => downloadSingle(item?.horizontalBlob, `horizontal-${index + 1}.png`)}>
        Download 16:9
      </Button>
      <Button variant="secondary" onClick={() => downloadSingle(item?.verticalBlob, `vertical-${index + 1}.png`)}>
        Download 9:16
      </Button>
      <Button onClick={() => copyToClipboard(item?.horizontalBlob)}>Copy 16:9</Button>
      <Button onClick={() => copyToClipboard(item?.verticalBlob)}>Copy 9:16</Button>

      <div className="col-span-2 flex flex-wrap gap-2">
        <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => share(item?.horizontalBlob, "horizontal")}>
          Share 16:9
        </Button>
        {item?.shareUrlHorizontal ? (
          <a
            className="text-blue-600 underline text-sm"
            href={item.shareUrlHorizontal}
            target="_blank"
            rel="noreferrer"
          >
            Open 16:9 link
          </a>
        ) : null}
        <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => share(item?.verticalBlob, "vertical")}>
          Share 9:16
        </Button>
        {item?.shareUrlVertical ? (
          <a className="text-blue-600 underline text-sm" href={item.shareUrlVertical} target="_blank" rel="noreferrer">
            Open 9:16 link
          </a>
        ) : null}
      </div>
    </div>
  )
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
