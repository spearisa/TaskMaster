import { ReactNode } from 'react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (e: any) => void;
  disabled?: boolean;
}

export function TaskCheckbox({ checked, onChange, disabled = false }: TaskCheckboxProps) {
  return (
    <label className="relative flex-shrink-0 h-5 w-5 cursor-pointer block">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
        className="opacity-0 h-0 w-0 absolute"
      />
      <span className={`
        absolute top-0 left-0 h-5 w-5 rounded-full 
        border-2 border-primary 
        ${checked ? 'bg-primary' : 'bg-white'}
        transition-colors duration-200
        ${disabled ? 'opacity-50' : ''}
        flex items-center justify-center
      `}>
        {checked && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="absolute"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </span>
    </label>
  );
}
