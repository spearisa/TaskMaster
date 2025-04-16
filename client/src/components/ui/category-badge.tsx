interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  // Map categories to colors
  const categoryColors: Record<string, string> = {
    'Work': 'bg-purple-50 text-purple-600 border border-purple-100',
    'Personal': 'bg-green-50 text-green-600 border border-green-100',
    'Shopping': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    'Health': 'bg-teal-50 text-teal-600 border border-teal-100',
  };

  // Default or fallback color
  const colorClass = categoryColors[category] || 'bg-gray-50 text-gray-600 border border-gray-100';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {category}
    </span>
  );
}
