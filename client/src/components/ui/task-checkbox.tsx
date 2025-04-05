import { ChangeEvent } from 'react';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function TaskCheckbox({ checked, onChange, disabled = false }: TaskCheckboxProps) {
  return (
    <label className="relative flex-shrink-0 mr-3 mt-0.5 h-6 w-6 cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
        className="opacity-0 h-0 w-0 absolute"
      />
      <span className={`
        absolute top-0 left-0 h-6 w-6 rounded-full 
        border-2 border-primary 
        ${checked ? 'bg-primary' : 'bg-transparent'}
        transition-colors duration-200
        ${disabled ? 'opacity-50' : ''}
      `}>
        {checked && (
          <span className="absolute left-2 top-1 w-1.5 h-3 border-r-2 border-b-2 border-white transform rotate-45"></span>
        )}
      </span>
    </label>
  );
}
