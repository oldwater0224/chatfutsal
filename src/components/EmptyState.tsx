import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}
export default function EmptyState({
  icon,
  title,
  description,
  linkText,
  linkHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-700 font-medium">{title}</p>
      {description && (
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      )}
      {linkText && linkHref && (
        <Link
          href={linkHref}
          className="mt-4 text-green-600 font-medium hover:text-green-700"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
