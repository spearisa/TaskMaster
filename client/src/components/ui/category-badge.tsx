interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="px-2 py-0.5 bg-neutral-100 rounded-lg text-xs text-neutral-500">
      {category}
    </span>
  );
}
