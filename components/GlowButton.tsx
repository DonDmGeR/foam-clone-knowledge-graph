import React from 'react';

// TypeScript interfaces for the GlowButton component
export interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// Loading spinner component
const LoadingSpinner: React.FC<{ size: 'small' | 'medium' | 'large' }> = ({ size }) => {
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const GlowButton: React.FC<GlowButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  onClick,
  className = '',
  type = 'button',
  ...restProps
}) => {
  // Filter out non-DOM attributes to prevent React warnings
  const { 
    variant: _variant, 
    size: _size, 
    loading: _loading, 
    icon: _icon, 
    iconPosition: _iconPosition, 
    fullWidth: _fullWidth,
    ...domProps 
  } = restProps;
  // Base classes for the glow button
  const baseClasses = 'glow-button relative inline-flex items-center justify-center font-bold border rounded-2xl outline-none transition-all duration-300 cursor-pointer select-none';
  
  // Variant classes
  const variantClasses = {
    primary: 'glow-button-primary',
    secondary: 'glow-button-secondary', 
    danger: 'glow-button-danger',
    success: 'glow-button-success'
  };

  // Size classes
  const sizeClasses = {
    small: 'glow-button-small text-xs px-4 py-2',
    medium: 'text-sm px-6 py-3',
    large: 'glow-button-large text-base px-8 py-4'
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Disabled classes
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  // Handle click events
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  // Render icon with proper positioning
  const renderIcon = () => {
    if (loading) {
      return <LoadingSpinner size={size} />;
    }
    return icon;
  };

  // Determine spacing between icon and text
  const getIconSpacing = () => {
    if (!icon && !loading) return '';
    
    const spacing = {
      small: 'gap-1',
      medium: 'gap-2', 
      large: 'gap-3'
    };
    
    return spacing[size];
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...domProps}
    >
      <span className={`flex items-center justify-center ${getIconSpacing()}`}>
        {(icon || loading) && iconPosition === 'left' && (
          <span className="flex-shrink-0">
            {renderIcon()}
          </span>
        )}
        
        {children && (
          <span className={loading ? 'opacity-75' : ''}>
            {children}
          </span>
        )}
        
        {(icon || loading) && iconPosition === 'right' && (
          <span className="flex-shrink-0">
            {renderIcon()}
          </span>
        )}
      </span>
    </button>
  );
};

export default GlowButton;