import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "outline" | "success" | "destructive" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase",
        {
            "border-transparent bg-black text-white hover:bg-black/80": variant === "default",
            "text-foreground border-black": variant === "outline",
            "border-transparent bg-green-600 text-white hover:bg-green-700": variant === "success",
            "border-transparent bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            "border-transparent bg-yellow-400 text-black hover:bg-yellow-500": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
