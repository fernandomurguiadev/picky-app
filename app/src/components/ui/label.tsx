"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// React 19 + Radix UI consolidated package: LabelProps doesn't expose standard
// HTML label attributes (className, htmlFor, children) in its type definition.
// We bypass by typing as React.LabelHTMLAttributes<HTMLLabelElement> directly,
// which IS the full native label interface, and intersecting with asChild.
type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  asChild?: boolean
  children?: React.ReactNode
}

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...(props as any)}
    />
  )
}

export { Label }
export type { LabelProps }
