import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
}

export function AppmoLogo({ 
  className, 
  size = 'md',
  showText = true, 
  onClick 
}: LogoProps) {
  // Map size to specific dimensions
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-24 w-24'
  };

  // Text size based on logo size
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2", 
        onClick && "cursor-pointer",
        className
      )} 
      onClick={onClick}
    >
      {/* SVG version of the clipboard logo matching the screenshot */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        className={cn(
          sizeClasses[size],
          "fill-[#5271ff]" // Blue color matching the screenshot
        )}
      >
        <path d="M70,12h-6c0-3.31-2.69-6-6-6H42c-3.31,0-6,2.69-6,6h-6c-7.73,0-14,6.27-14,14v54c0,7.73,6.27,14,14,14h40c7.73,0,14-6.27,14-14V26C84,18.27,77.73,12,70,12z M42,12h16v4H42V12z M70,86H30c-3.31,0-6-2.69-6-6V26c0-3.31,2.69-6,6-6h6v4c0,2.21,1.79,4,4,4h20c2.21,0,4-1.79,4-4v-4h6c3.31,0,6,2.69,6,6v54C76,83.31,73.31,86,70,86z"/>
        <circle cx="39" cy="41" r="4"/>
        <circle cx="39" cy="61" r="4"/>
        <rect x="49" y="39" width="20" height="4" rx="2"/>
        <rect x="49" y="59" width="20" height="4" rx="2"/>
      </svg>
      
      {showText && (
        <span className={cn(
          "font-bold text-[#333333]", // Dark gray text color
          textSizeClasses[size]
        )}>
          Appmo
        </span>
      )}
    </div>
  );
}