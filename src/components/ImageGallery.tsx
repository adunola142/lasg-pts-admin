"use client";

import { ImageOff, Maximize2 } from "lucide-react";

/** The small circular "open full-resolution in a new tab" affordance
    shown over the bottom-right corner of an image. */
function ExpandBadge() {
  return (
    <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition group-hover:bg-black/70">
      <Maximize2 size={13} />
    </span>
  );
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted">
      <ImageOff size={16} />
      {label}
    </div>
  );
}

/** A grid of photo thumbnails; clicking one opens the full-resolution
    image in a new tab. Used inside detail panels for enumeration/delivery/
    gap photo evidence. */
export function ImageGallery({ urls, emptyLabel = "No photos" }: { urls: string[]; emptyLabel?: string }) {
  if (urls.length === 0) {
    return <EmptyPlaceholder label={emptyLabel} />;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, i) => (
        <a
          key={url + i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-foreground/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover transition group-hover:opacity-90" />
          <ExpandBadge />
        </a>
      ))}
    </div>
  );
}

/** A single labeled image (e.g. a signature) rather than a gallery grid. */
export function SingleImage({ url, alt, emptyLabel }: { url: string | null | undefined; alt: string; emptyLabel: string }) {
  if (!url) {
    return <EmptyPlaceholder label={emptyLabel} />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full overflow-hidden rounded-xl border border-border bg-foreground/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="w-full object-contain transition group-hover:opacity-90" />
      <ExpandBadge />
    </a>
  );
}
