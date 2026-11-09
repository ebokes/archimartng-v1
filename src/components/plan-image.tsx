'use client'

import { useState } from 'react'
import Image from 'next/image'

export function PlanImage({
  src,
  alt,
  sizes,
  className = 'object-cover',
}: {
  src: string | null
  alt: string
  sizes: string
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div className="grid h-full place-items-center px-4 text-center text-sm text-muted-foreground">
        Image unavailable
      </div>
    )
  }

  return (
    <Image
      unoptimized
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  )
}
