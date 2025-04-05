type PriorityType = 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityClasses = {
    high: 'bg-red-50 text-red-500',
    medium: 'bg-orange-50 text-orange-500',
    low: 'bg-neutral-100 text-neutral-500',
  };

  const priorityType = priority.toLowerCase() as PriorityType;
  const className = priorityClasses[priorityType] || priorityClasses.low;

  return (
    <div className={`text-xs px-2 py-1 rounded-full ${className}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </div>
  );
}
