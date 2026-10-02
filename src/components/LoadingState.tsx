import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Gathering your cycle rhythms...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-warm-200" />
        <div className="absolute inset-0 rounded-full border-2 border-terracotta-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-warm-600 animate-pulse">{message}</p>
    </div>
  );
};
