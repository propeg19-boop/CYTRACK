import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none min-h-touch select-none';

  const variantStyles = {
    primary:
      'bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white shadow-soft hover:shadow-card',
    secondary:
      'bg-warm-200 hover:bg-warm-300 active:bg-warm-400 text-warm-900',
    outline:
      'border border-warm-300 hover:border-warm-400 active:bg-warm-100 text-warm-800 bg-white/60',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-soft',
    ghost:
      'text-warm-600 hover:text-warm-900 hover:bg-warm-200/50',
  };

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 rounded-xl min-h-[38px] gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-2xl min-h-touch gap-2',
    lg: 'text-base px-6 py-3.5 rounded-3xl min-h-[52px] gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
