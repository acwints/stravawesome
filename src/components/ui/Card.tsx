import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ children, icon, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`}>
      {icon && (
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{children}</h3>
    </div>
  );
}
