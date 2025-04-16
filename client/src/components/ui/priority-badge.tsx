type PriorityType = 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityClasses = {
    high: 'bg-red-50 text-red-600 border border-red-100',
    medium: 'bg-orange-50 text-orange-600 border border-orange-100',
    low: 'bg-blue-50 text-blue-600 border border-blue-100',
  };

  const priorityType = priority.toLowerCase() as PriorityType;
  const className = priorityClasses[priorityType] || priorityClasses.low;

  return (
    <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${className}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </div>
  );
}
