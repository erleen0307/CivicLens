import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  colorClass: string;
  bgClass: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass,
  bgClass
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),0_12px_32px_-4px_rgba(0,0,0,0.05)] hover:border-slate-300/80 hover:-translate-y-0.5 transition-all duration-300 flex items-start justify-between gap-3 sm:gap-4">
      <div className="space-y-1.5 min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-900 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-500 font-normal leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">{description}</p>
      </div>
      <div className={`p-2.5 sm:p-3 rounded-xl ${bgClass} ${colorClass} border border-current/10 shadow-xs shrink-0`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2px]" />
      </div>
    </div>
  );
}
