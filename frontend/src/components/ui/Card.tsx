import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-700 rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);
