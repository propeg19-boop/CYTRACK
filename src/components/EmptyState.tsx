import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/70 rounded-3xl border border-warm-200/80 text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center text-warm-600 shadow-soft">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold text-warm-900">{title}</h3>
        <p className="text-sm text-warm-600 max-w-xs">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
