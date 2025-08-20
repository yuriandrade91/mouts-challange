import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => (
  <button
    className={`bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-sky-400 ${className}`}
    {...props}
  >
    {children}
  </button>
);
