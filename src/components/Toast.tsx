import React from 'react';

interface ToastProps {
  message: string;
  icon?: string;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, icon = '🍂', isVisible }) => {
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#2C1E16] text-white shadow-warmLg text-xs sm:text-sm font-medium transition-all duration-300 pointer-events-none no-print ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <span className="text-base select-none shrink-0" role="img" aria-label="notification icon">
        {icon}
      </span>
      <span className="leading-snug">{message}</span>
    </div>
  );
};
