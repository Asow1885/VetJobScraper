import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: 'active' | 'warning' | 'error' | 'inactive';
  className?: string;
}

const statusStyles = {
  active: "bg-green-500",
  warning: "bg-yellow-500", 
  error: "bg-red-500",
  inactive: "bg-gray-400"
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <span 
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        statusStyles[status],
        className
      )}
      data-testid={`status-indicator-${status}`}
    />
  );
}
