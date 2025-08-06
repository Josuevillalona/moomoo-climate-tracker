import * as React from "react"
import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-in-out",
      className
    )}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }