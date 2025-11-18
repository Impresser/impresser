'use client';

import React from 'react';

interface CommonCheckBoxProps {
  id?: string;
  name?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CommonCheckBox({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  labelClassName = '',
  size = 'md',
}: CommonCheckBoxProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            ${sizeClasses[size]}
            rounded border-2 transition-all duration-200 ease-in-out
            flex items-center justify-center
            ${
              checked
                ? 'bg-[#0059FF] border-[#0059FF]'
                : 'bg-white border-gray-300 hover:border-[#0059FF]'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            peer-focus:ring-2 peer-focus:ring-[#0059FF] peer-focus:ring-offset-2
            peer-focus:outline-none
            ${!disabled && !checked ? 'hover:bg-gray-50' : ''}
            ${!disabled && checked ? 'hover:bg-[#0062CC] hover:border-[#0062CC]' : ''}
          `}
        >
          {checked && (
            <svg
              className={`${iconSizes[size]} text-white`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span
          className={`text-sm font-medium text-gray-700 ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${labelClassName}`}
        >
          {label}
        </span>
      )}
    </label>
  );
}




