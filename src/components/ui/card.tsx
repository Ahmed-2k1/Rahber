import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Every card carries the "mihrab corner": the top-left corner is
  rounded far more than the other three — a quiet echo of an arch.

  `lit` draws a thin gold trace along that corner. It is a status
  signal with one meaning app-wide — "this record reflects active,
  healthy tabligh engagement" — so it must stay rare: full-aamaal
  masjids and recently-visited brothers only.
*/
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { lit?: boolean }
>(({ className, lit = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-lg rounded-tl-arch border bg-card text-card-foreground shadow-sm transition-transform active:scale-[0.98]",
      className
    )}
    {...props}
  >
    {lit && (
      <span
        aria-hidden
        className="pointer-events-none absolute -left-px -top-px h-8 w-8 rounded-tl-arch border-l border-t border-gold/60"
      />
    )}
    {children}
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
