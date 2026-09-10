import React from 'react';
import { soundFx } from '../../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'amber' | 'crimson' | 'white';
  size?: 'normal' | 'large' | 'massive';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'green',
  size = 'normal',
  fullWidth = false,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundFx.playClickSound();
    onClick?.(e);
  };

  const variantClasses = {
    green: 'duo-btn-green',
    amber: 'duo-btn-amber',
    crimson: 'duo-btn-crimson',
    white: 'duo-btn-white',
  }[variant];

  const sizeClasses = {
    normal: 'min-h-[56px] text-lg px-6 py-3',
    large: 'min-h-[64px] text-xl px-8 py-4',
    massive: 'min-h-[72px] text-2xl px-10 py-5',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={handleClick}
      className={`duo-btn ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
