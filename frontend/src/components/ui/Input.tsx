import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`}
    {...props}
  />
);
