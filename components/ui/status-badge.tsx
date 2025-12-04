import { MdEdit, MdPublic, MdArchive } from "react-icons/md";

interface StatusBadgeProps {
  status: "draft" | "published" | "archived";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "md", showIcon = true }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const statusConfig = {
    draft: {
      label: "Draft",
      icon: MdEdit,
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    published: {
      label: "Published",
      icon: MdPublic,
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    archived: {
      label: "Archived",
      icon: MdArchive,
      className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${config.className}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

