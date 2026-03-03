import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#2C2C2E] dark:via-[#3A3A3C] dark:to-[#2C2C2E] bg-[length:200%_100%] rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
