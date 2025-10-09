import * as React from "react";
import { cn } from "@/lib/utils";

const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full overflow-auto", className)} {...props} />
));
ResponsiveTable.displayName = "ResponsiveTable";

export default ResponsiveTable;