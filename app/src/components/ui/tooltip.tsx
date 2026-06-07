"use client"

import * as React from "react"
import { Tooltip as RadixTooltip } from "radix-ui"

// React 19 + Radix UI consolidated: Tooltip sub-components lack children/className in typings.
const TooltipPrimitive = RadixTooltip as any

import { cn } from "@/lib/utils"

type Side = "top" | "right" | "bottom" | "left"

function TooltipProvider({
  children,
  delayDuration = 700,
  ...props
}: {
  children?: React.ReactNode
  delayDuration?: number
  [key: string]: unknown
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

function Tooltip({
  children,
  ...props
}: {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
}) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
}

function TooltipTrigger({
  children,
  className,
  asChild,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  asChild?: boolean
  [key: string]: unknown
}) {
  return (
    <TooltipPrimitive.Trigger className={className} asChild={asChild} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  children,
  className,
  sideOffset = 4,
  side,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  sideOffset?: number
  side?: Side
  [key: string]: unknown
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        side={side}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
