import * as React from 'react';
import { cn } from '@/lib/utils/styles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  asChild = false,
  ...props
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center rounded-md font-medium 
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:scale-[1.02]
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.97] hover:shadow-md transform-gpu
  `;
  
  const variants = {
    primary: `
      bg-indigo-600 text-white 
      hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5
      focus:ring-indigo-500
      active:bg-indigo-800
    `,
    secondary: `
      bg-white text-gray-700 
      hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:-translate-y-0.5
      focus:ring-indigo-500 
      border border-gray-300
      active:bg-gray-100
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const Comp = asChild ? React.Fragment : 'button';

  return (
    <Comp
      ref={ref}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${loading ? 'relative !text-transparent' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    > 
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </Comp>
  );
});

Button.displayName = 'Button';

export { Button };